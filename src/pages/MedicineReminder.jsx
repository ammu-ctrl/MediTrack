/**
 * MedicineReminder.jsx
 * Medicine Reminder System with Robust Alarm Functionality
 * 
 * Features:
 * - Add medicines with dosage and multiple reminder times per day
 * - Real-time Firestore integration with onSnapshot listener
 * - Alarm logic with setInterval (checks every 60 seconds)
 * - Snooze functionality (5 minutes with multiple snooze capabilities)
 * - Modal notification display with audio alert
 * - Daily recurring reminders
 * - Trigger prevention (avoids duplicate reminders in same minute)
 * - Proper interval & timeout cleanup
 * 
 * Stability Features:
 * - Single interval instance (no duplicates)
 * - Tracks already-triggered reminders to prevent duplicates
 * - Separate snooze timeout management per medicine
 * - Automatic cleanup on unmount and logout
 * - Proper error handling with try/catch
 */

import React, { useState, useEffect, useRef } from "react";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  query,
  where,
  onSnapshot,
  updateDoc,
} from "firebase/firestore";
import { db } from "../firebase.config";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import "../styles/MedicineReminder.css";

function MedicineReminder() {
  const { user } = useSelector((state) => state.auth);
  
  // ===================== State Management =====================
  
  // Form & UI state
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    dosage: "",
    times: [],
  });
  const [timeInput, setTimeInput] = useState("");

  // Reminder Modal State
  const [activeReminder, setActiveReminder] = useState(null);
  
  // State to track already-triggered reminders (prevents duplicate alerts in same minute)
  const [triggeredReminders, setTriggeredReminders] = useState({});
  
  // State to manage active snooze timeouts per medicine
  const [snoozeTimeouts, setSnoozeTimeouts] = useState({});
  
  // ===================== Refs for Interval Management =====================
  
  // Ref to store the interval ID (prevents multiple intervals)
  const intervalRefInterval = useRef(null);
  
  // Ref to store Firestore listener unsubscribe function
  const unsubscribeRef = useRef(null);

  /**
   * ===================== Main Effect: Firestore Listener & Interval Setup =====================
   * 
   * This effect:
   * 1. Sets up real-time listener for medicines from Firestore
   * 2. Creates single interval for reminder checking (every 60 seconds)
   * 3. Cleans up resources on unmount or user logout
   * 
   * Key Features:
   * - Only creates one interval (no duplicates)
   * - Stores unsub functions in refs for proper cleanup
   * - Resets triggered reminders on data refresh
   * - Handles logout properly (interval stops)
   */
  useEffect(() => {
    // Exit if no user (logged out)
    if (!user) {
      // Cleanup: Stop any running interval
      if (intervalRefInterval.current) {
        clearInterval(intervalRefInterval.current);
        intervalRefInterval.current = null;
      }
      // Cleanup: Clear all snooze timeouts
      Object.values(snoozeTimeouts).forEach((timeoutId) => clearTimeout(timeoutId));
      setSnoozeTimeouts({});
      setTriggeredReminders({});
      return;
    }

    try {
      // ========== FIRESTORE REAL-TIME LISTENER ==========
      // Fetch medicines from Firestore collection: users/{userId}/medicines
      const medicinesQuery = query(
        collection(db, "users", user.uid, "medicines"),
        where("userId", "==", user.uid)
      );

      // Set up onSnapshot listener for real-time updates
      unsubscribeRef.current = onSnapshot(
        medicinesQuery,
        (snapshot) => {
          try {
            const medicinesData = snapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            }));
            setMedicines(medicinesData);
            
            // Reset triggered reminders when medicines data refreshes
            // This ensures reminders are re-triggered if medicines are updated
            setTriggeredReminders({});
          } catch (error) {
            console.error("Error processing medicines snapshot:", error);
            toast.error("Error loading medicines");
          }
        },
        (error) => {
          console.error("Firestore listener error:", error);
          toast.error("Failed to sync medicines");
        }
      );

      // ========== REMINDER CHECK INTERVAL ==========
      // Only create interval if one doesn't exist
      if (intervalRefInterval.current) {
        clearInterval(intervalRefInterval.current);
      }

      // Start interval to check reminders every 1 second (for immediate trigger)
      intervalRefInterval.current = setInterval(() => {
        checkReminders();
      }, 1000); // 1000 ms = 1 second (ensures quick detection)

      // Perform initial check immediately (don't wait for first interval)
      checkReminders();

      // ========== CLEANUP FUNCTION ==========
      // Cleanup is called when:
      // 1. Component unmounts
      // 2. User logs out (user changes)
      // 3. Dependencies change
      return () => {
        // Clear the interval
        if (intervalRefInterval.current) {
          clearInterval(intervalRefInterval.current);
          intervalRefInterval.current = null;
        }

        // Unsubscribe from Firestore listener
        if (unsubscribeRef.current) {
          unsubscribeRef.current();
          unsubscribeRef.current = null;
        }

        // Clear all snooze timeouts
        Object.values(snoozeTimeouts).forEach((timeoutId) => {
          clearTimeout(timeoutId);
        });
        setSnoozeTimeouts({});

        // Reset triggered reminders
        setTriggeredReminders({});

        // Close any open reminder modal
        setActiveReminder(null);
      };
    } catch (error) {
      console.error("Error setting up reminders:", error);
      toast.error("Failed to initialize reminders");
    }

    // Dependencies: Re-run effect only if user changes (login/logout)
  }, [user]);

  /**
   * ===================== CHECK REMINDERS FUNCTION =====================
   * 
   * Core Alarm Logic:
   * 1. Fetches current system time (HH:MM format)
   * 2. Iterates through all medicines and their reminder times
   * 3. Compares current time with stored reminder times
   * 4. PREVENTS DUPLICATE TRIGGERS using triggeredReminders state
   * 5. Checks for active snooze and extends timeout if needed
   * 6. Triggers modal and sound when time matches
   * 
   * Trigger Prevention Strategy:
   * - Store triggered reminder IDs in triggeredReminders state
   * - Each reminder ID = "{medicineId}-{time}"
   * - Only trigger if reminder hasn't been triggered in current minute
   * - Reset triggered reminders when minute changes (every 60 seconds)
   * 
   * Error Handling:
   * - Wrapped in try/catch for safety
   * - Doesn't throw errors that could stop the interval
   * - Logs errors for debugging
   */
  const checkReminders = () => {
    try {
      // Safety check: exit if no medicines
      if (!medicines || medicines.length === 0) {
        return;
      }

      // Get current system time in HH:MM format
      const now = new Date();
      const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(
        now.getMinutes()
      ).padStart(2, "0")}`;

      // Only log every 10 seconds to avoid console spam
      if (now.getSeconds() % 10 === 0) {
        console.log(`[Reminder Check] Current time: ${currentTime}`);
      }

      // Iterate through each medicine
      medicines.forEach((medicine) => {
        // Safety check: ensure medicine has times array
        if (!medicine.times || !Array.isArray(medicine.times) || medicine.times.length === 0) {
          return;
        }

        // Iterate through each reminder time for this medicine
        medicine.times.forEach((reminderTime) => {
          try {
            // Create unique ID for this reminder instance
            const reminderId = `${medicine.id}-${reminderTime}`;

            // ========== CHECK IF ALREADY TRIGGERED ==========
            // TRIGGER PREVENTION: Don't trigger same reminder twice in the same minute
            if (triggeredReminders[reminderId]) {
              return;
            }

            // ========== CHECK IF SNOOZE IS ACTIVE ==========
            if (snoozeTimeouts[reminderId]) {
              // A snooze timeout is active for this reminder
              // The reminder will be re-triggered when snooze expires
              return;
            }

            // ========== CHECK IF TIME MATCHES ==========
            if (currentTime === reminderTime) {
              console.log(`[TRIGGER] Reminder triggered: ${medicine.name} at ${reminderTime}`);

              // Mark this reminder as triggered (prevent duplicates in same minute)
              setTriggeredReminders((prev) => ({
                ...prev,
                [reminderId]: true,
              }));

              // Show the reminder modal with medicine details
              setActiveReminder({
                id: medicine.id,
                name: medicine.name,
                dosage: medicine.dosage,
                time: reminderTime,
                reminderId: reminderId,
              });

              // Play notification sound asynchronously
              playNotificationSound();
            }
          } catch (error) {
            console.error(`Error checking reminder time for ${medicine.name}:`, error);
          }
        });
      });
    } catch (error) {
      console.error("Error in checkReminders:", error);
      // Don't throw - let interval continue even if one check fails
    }
  };

  /**
   * ===================== MINUTE CHANGE DETECTION EFFECT =====================
   * 
   * Purpose: Reset triggered reminders when the minute changes
   * 
   * Logic:
   * 1. Runs a 1-second interval to check if minute has changed
   * 2. When minute changes, clears the triggeredReminders state
   * 3. This allows reminders to trigger again in the next minute
   * 4. Cleanup stops the detection interval on unmount
   * 
   * Why Needed:
   * - Reminders are marked as "triggered" to prevent duplicate alerts
   * - We need to reset this when the minute rolls over
   * - Next minute can have the same reminder trigger again
   */
  useEffect(() => {
    // Create a 1-second interval to detect minute changes
    const minuteChangeInterval = setInterval(() => {
      const now = new Date();
      const currentMinute = now.getMinutes();

      // Store current minute in a ref or state to compare
      // If minute changed, reset triggered reminders
      if (!window.lastCheckedMinute) {
        window.lastCheckedMinute = currentMinute;
      } else if (window.lastCheckedMinute !== currentMinute) {
        // Minute has changed - reset triggered reminders
        window.lastCheckedMinute = currentMinute;
        setTriggeredReminders({}); // Clear triggered state for new minute
        console.log(`[Minute Changed] Triggered reminders reset for minute ${currentMinute}`);
      }
    }, 1000); // Check every second

    // Cleanup
    return () => {
      clearInterval(minuteChangeInterval);
    };
  }, []);

  /**
   * Play notification sound
   * 
   * Creates a simple beep sound using Web Audio API
   * Safe: Wrapped in try/catch - doesn't break if audio fails
   * Browser Compatibility: Works in modern browsers (Chrome, Firefox, Safari, Edge)
   * 
   * Frequency: 800 Hz sine wave
   * Duration: 0.5 seconds
   * Volume: 30% (0.3) to avoid startling user
   */
  const playNotificationSound = () => {
    try {
      // Create audio context (works in modern browsers)
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      // Connect audio nodes
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Set sound parameters
      oscillator.frequency.value = 800; // 800 Hz frequency
      oscillator.type = "sine"; // Smooth sine wave

      // Fade in/out effect for smooth sound
      const now = audioContext.currentTime;
      gainNode.gain.setValueAtTime(0.3, now); // Start at 30% volume
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.5); // Fade out over 0.5s

      // Play sound for 0.5 seconds
      oscillator.start(now);
      oscillator.stop(now + 0.5);

      console.log("[Audio] Notification sound played");
    } catch (error) {
      // Fail silently - audio not available or blocked
      console.warn("[Audio] Could not play notification sound:", error.message);
      // Fallback: Try browser notification API
      try {
        if (Notification.permission === "granted") {
          new Notification("Medicine Reminder", {
            body: "Time to take your medicine!",
            icon: "💊",
          });
        }
      } catch {}
    }
  };

  /**
   * ===================== HANDLE FORM CHANGES =====================
   * 
   * Updates form state when user types in medicine name or dosage
   * Simple state update using event target name and value
   */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  /**
   * ===================== ADD REMINDER TIME =====================
   * 
   * When user enters a time and clicks "Add Time":
   * 1. Validates time format (HH:MM)
   * 2. Checks for duplicates
   * 3. Adds to times array in sorted order
   * 4. Clears input field for next entry
   * 
   * Time Format:
   * - Input type="time" returns HH:MM format
   * - Example: "08:30"
   * - Automatically validated by HTML5
   * 
   * Validation:
   * - Must match HH:MM pattern (two digits : two digits)
   * - No duplicates allowed
   * - User gets toast feedback if validation fails
   */
  const addTime = () => {
    try {
      // Validate time format (HH:MM)
      if (!timeInput || !timeInput.match(/^\d{2}:\d{2}$/)) {
        toast.error("Please enter time in HH:MM format");
        return;
      }

      // Check for duplicates
      if (form.times.includes(timeInput)) {
        toast.error("This time is already added");
        return;
      }

      // Add to times array and sort chronologically
      setForm({
        ...form,
        times: [...form.times, timeInput].sort(), // Sort times automatically
      });

      // Clear input for next entry
      setTimeInput("");

      console.log(`[Time Added] ${timeInput} added to reminder times`);
    } catch (error) {
      console.error("Error adding time:", error);
      toast.error("Error adding time");
    }
  };

  /**
   * ===================== REMOVE REMINDER TIME =====================
   * 
   * When user clicks 'X' on a time chip:
   * 1. Removes time from times array
   * 2. UI updates immediately
   * 
   * Note:
   * - Filtering is simple and fast
   * - Times remain sorted after removal
   * - No Firestore call until form is submitted
   */
  const removeTime = (timeToRemove) => {
    try {
      setForm({
        ...form,
        times: form.times.filter((time) => time !== timeToRemove),
      });

      console.log(`[Time Removed] ${timeToRemove} removed from reminder times`);
    } catch (error) {
      console.error("Error removing time:", error);
      toast.error("Error removing time");
    }
  };

  /**
   * ===================== SAVE MEDICINE TO FIRESTORE =====================
   * 
   * When user submits the form:
   * 1. Validates all inputs (name, dosage, at least one time)
   * 2. Creates document in: users/{userId}/medicines
   * 3. Stores: name, dosage, times array, user info, timestamps
   * 4. Times array is already sorted in chronological order
   * 5. Clears form and closes modal on success
   * 
   * Firestore Collection Structure:
   * Collection: users/{userId}/medicines
   * Document fields:
   *   - name: string (medicine name)
   *   - dosage: string (e.g., "500mg")
   *   - times: array<HH:MM> (e.g., ["08:00", "14:00", "20:00"])
   *   - userId: string (for query filtering)
   *   - createdAt: ISO timestamp
   *   - takenToday: array (future use)
   * 
   * Real-time Update:
   * - onSnapshot listener in useEffect automatically fetches this
   * - UI updates instantly when new medicine is added
   * - No need to manually refetch
   * 
   * Validation:
   * - Name: Required, must not be empty
   * - Dosage: Required, must not be empty
   * - Times: Must have at least one reminder time
   * 
   * Error Handling:
   * - Try/catch for Firestore operation
   * - Toast notifications for user feedback
   * - Finally block ensures loading state is cleared
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // ========== INPUT VALIDATION ==========
      if (!form.name.trim()) {
        toast.error("Medicine name is required");
        setLoading(false);
        return;
      }

      if (!form.dosage.trim()) {
        toast.error("Dosage is required");
        setLoading(false);
        return;
      }

      if (form.times.length === 0) {
        toast.error("Add at least one reminder time");
        setLoading(false);
        return;
      }

      console.log(`[Save] Saving medicine: ${form.name} with ${form.times.length} times`);

      // ========== SAVE TO FIRESTORE ==========
      await addDoc(collection(db, "users", user.uid, "medicines"), {
        name: form.name.trim(),
        dosage: form.dosage.trim(),
        times: form.times, // Already sorted from addTime()
        userId: user.uid,
        createdAt: new Date().toISOString(),
        takenToday: [], // For future implementation
      });

      console.log("[Save] Medicine saved successfully");

      // ========== SUCCESS FEEDBACK ==========
      toast.success(
        `✓ ${form.name} reminder added with ${form.times.length} time(s) per day`,
        { autoClose: 3000 }
      );

      // Reset form
      setForm({ name: "", dosage: "", times: [] });
      setTimeInput("");
      setShowForm(false);
    } catch (error) {
      console.error("Error saving medicine:", error);
      toast.error(`Error saving medicine: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  /**
   * ===================== DELETE MEDICINE =====================
   * 
   * When user clicks delete button:
   * 1. Shows confirmation dialog (prevents accidental deletion)
   * 2. Deletes document from: users/{userId}/medicines/{medicineId}
   * 3. Firestore listener automatically updates UI
   * 4. Shows success/error notification
   * 
   * Important:
   * - Deletion is permanent
   * - Reminder data is still available in medicineLogs collection
   * - onSnapshot listener will trigger and update medicines list
   * 
   * Error Handling:
   * - Try/catch for Firestore operation
   * - Shows error message to user
   * - Logs detailed error for debugging
   */
  const handleDelete = async (id) => {
    try {
      // Confirmation dialog to prevent accidental deletion
      if (!window.confirm("Are you sure you want to delete this medicine reminder?")) {
        console.log("[Delete] Deletion cancelled by user");
        return;
      }

      console.log(`[Delete] Deleting medicine: ${id}`);

      // Delete from Firestore
      await deleteDoc(doc(db, "users", user.uid, "medicines", id));

      console.log("[Delete] Medicine deleted successfully");
      toast.success("✓ Medicine reminder deleted", { autoClose: 2000 });
    } catch (error) {
      console.error("Error deleting medicine:", error);
      toast.error(`Error deleting medicine: ${error.message}`);
    }
  };

  /**
   * ===================== MARK MEDICINE AS TAKEN =====================
   * 
   * When user clicks "I've Taken It":
   * 1. Gets current time as "taken time"
   * 2. Creates log entry with all details
   * 3. Saves to Firestore: users/{userId}/medicineLogs
   * 4. Closes the reminder modal
   * 5. Shows success notification
   * 
   * Firestore schema:
   * - medicineId: ID of the medicine
   * - medicineName: Name for reference
   * - dosage: Dosage taken
   * - scheduledTime: When it was supposed to be taken
   * - actualTime: When user actually took it
   * - date: Date in YYYY-MM-DD format
   * - status: "taken" (for filtering)
   * - userId: User who took the medicine
   *
   * Error Handling:
   * - Try/catch wraps Firestore operation
   * - Shows toast on success/failure
   */
  const handleTaken = async () => {
    try {
      if (!activeReminder) {
        console.warn("No active reminder to mark as taken");
        return;
      }

      console.log(`[Taken] Marking medicine as taken: ${activeReminder.name}`);

      // Create log entry for the medicine intake
      const logEntry = {
        medicineId: activeReminder.id,
        medicineName: activeReminder.name,
        dosage: activeReminder.dosage,
        scheduledTime: activeReminder.time,
        actualTime: new Date().toLocaleTimeString(),
        date: new Date().toISOString().split("T")[0], // YYYY-MM-DD format
        status: "taken",
        userId: user.uid,
        timestamp: new Date().toISOString(),
      };

      // Save to Firestore
      await addDoc(
        collection(db, "users", user.uid, "medicineLogs"),
        logEntry
      );

      // Success notification
      toast.success(
        `✓ ${activeReminder.name} marked as taken at ${logEntry.actualTime}`,
        { autoClose: 3000 }
      );

      // Remove reminder from triggered list so it doesn't show again this minute
      setTriggeredReminders((prev) => {
        const updated = { ...prev };
        delete updated[activeReminder.reminderId];
        return updated;
      });

      // Clear active reminder modal
      setActiveReminder(null);

      console.log("[Taken] Medicine logged successfully");
    } catch (error) {
      console.error("Error marking medicine as taken:", error);
      toast.error("Error logging medicine intake");
    }
  };

  /**
   * ===================== SNOOZE REMINDER FUNCTION =====================
   * 
   * Snooze Logic:
   * 1. Gets the reminder ID that triggered the modal
   * 2. Removes reminder from triggeredReminders (so it can be re-triggered)
   * 3. Creates a setTimeout for 5 minutes
   * 4. Stores timeout ID in snoozeTimeouts state
   * 5. When 5 minutes pass, timeout naturally expires
   * 6. Next interval check will re-trigger the reminder
   * 
   * Multiple Snooze Support:
   * - Each medicine can be snoozed independently
   * - Snooze IDs are stored in state
   * - When timeout expires, it's automatically cleaned
   * 
   * 5-Minute Snooze:
   * - 5 * 60 * 1000 = 300,000 milliseconds
   * - Can be adjusted if needed
   * 
   * Error Handling:
   * - Wrapped in try/catch
   * - Logs errors but doesn't break the app
   */
  const handleSnooze = () => {
    try {
      if (!activeReminder) {
        console.warn("No active reminder to snooze");
        return;
      }

      const reminderId = activeReminder.reminderId;
      const snoozeMinutes = 5;
      const snoozeDuration = snoozeMinutes * 60 * 1000; // 5 minutes in milliseconds

      console.log(`[Snooze] Snoosing reminder ${reminderId} for ${snoozeMinutes} minutes`);

      // Remove from triggered reminders so it can trigger again after snooze
      setTriggeredReminders((prev) => {
        const updated = { ...prev };
        delete updated[reminderId];
        return updated;
      });

      // Clear any existing snooze timeout for this reminder
      if (snoozeTimeouts[reminderId]) {
        clearTimeout(snoozeTimeouts[reminderId]);
        console.log(`[Snooze] Cleared existing snooze timeout for ${reminderId}`);
      }

      // Create new snooze timeout
      const timeoutId = setTimeout(() => {
        try {
          console.log(`[Snooze Expired] Snooze timeout expired for ${reminderId}`);
          
          // Remove from snooze timeouts
          setSnoozeTimeouts((prev) => {
            const updated = { ...prev };
            delete updated[reminderId];
            return updated;
          });

          // Show reminder again
          const medicine = medicines.find((m) => m.id === activeReminder.id);
          if (medicine) {
            setActiveReminder({
              id: activeReminder.id,
              name: activeReminder.name,
              dosage: activeReminder.dosage,
              time: activeReminder.time,
              reminderId: reminderId,
            });

            // Play sound again
            playNotificationSound();

            console.log(`[Snooze Expired] Re-triggered reminder: ${activeReminder.name}`);
          }
        } catch (error) {
          console.error("Error re-triggering after snooze:", error);
        }
      }, snoozeDuration);

      // Store timeout ID in state so we can clean it up later
      setSnoozeTimeouts((prev) => ({
        ...prev,
        [reminderId]: timeoutId,
      }));

      // Show user feedback
      toast.info(`⏰ Reminder snoozed for ${snoozeMinutes} minutes`, {
        autoClose: 2000,
      });

      // Close the modal
      setActiveReminder(null);
    } catch (error) {
      console.error("Error in handleSnooze:", error);
      toast.error("Error snoozing reminder");
    }
  };

  /**
   * ===================== SKIP REMINDER =====================
   * 
   * When user clicks "Skip":
   * 1. Creates log entry with "skipped" status
   * 2. Saves to Firestore for audit trail
   * 3. Closes the reminder modal
   * 4. Shows notification
   * 
   * Why Log Skipped Reminders:
   * - Maintains audit trail of reminder interactions
   * - Helps identify patterns (e.g., user always skips morning dose)
   * - User can view history to see which doses were skipped
   * 
   * Firestore schema (same as "taken"):
   * - status: "skipped" (allows filtering skipped vs taken)
   * - All other fields same as handleTaken
   * 
   * Error Handling:
   * - Try/catch wraps operation
   * - Continues even if Firestore fails
   * - Shows user feedback
   */
  const handleSkip = () => {
    try {
      if (!activeReminder) {
        console.warn("No active reminder to skip");
        return;
      }

      console.log(`[Skip] Skipping reminder for: ${activeReminder.name}`);

      // Create log entry for skipped reminder
      const logEntry = {
        medicineId: activeReminder.id,
        medicineName: activeReminder.name,
        dosage: activeReminder.dosage,
        scheduledTime: activeReminder.time,
        actualTime: new Date().toLocaleTimeString(),
        date: new Date().toISOString().split("T")[0],
        status: "skipped", // Mark as skipped
        userId: user.uid,
        timestamp: new Date().toISOString(),
      };

      // Log to Firestore asynchronously (fire and forget)
      // We don't await this because we want to close the modal immediately
      addDoc(collection(db, "users", user.uid, "medicineLogs"), logEntry)
        .then(() => {
          console.log("[Skip] Skipped reminder logged to Firestore");
        })
        .catch((error) => {
          console.error("Error logging skipped reminder:", error);
        });

      // Notify user
      toast.info(`⏭️ Reminder skipped for ${activeReminder.name}`, {
        autoClose: 2000,
      });

      // Remove from triggered list
      setTriggeredReminders((prev) => {
        const updated = { ...prev };
        delete updated[activeReminder.reminderId];
        return updated;
      });

      // Close modal
      setActiveReminder(null);

      console.log("[Skip] Reminder dismissed");
    } catch (error) {
      console.error("Error in handleSkip:", error);
      // Still close the modal even if there's an error
      setActiveReminder(null);
    }
  };

  return (
    <div className="medicine-reminder-container">
      <div className="medicine-reminder-header">
        <h1>💊 Medicine Reminder System</h1>
        <p>Never forget your medications again. Set reminders for multiple times per day.</p>
        <button
          className="btn-primary"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? "✕ Cancel" : "+ Add Medicine"}
        </button>
      </div>

      {/* Debug Panel - Shows alarm status */}
      <div style={{
        background: '#f0f4f8',
        border: '2px solid #3498db',
        borderRadius: '8px',
        padding: '15px',
        marginBottom: '20px',
        fontSize: '0.9rem',
        color: '#2c3e50'
      }}>
        <div style={{ fontWeight: 'bold', marginBottom: '10px', color: '#3498db' }}>
          🔧 Alarm Status
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
          <div>
            <span style={{ fontWeight: 'bold' }}>Current Time:</span> {new Date().toLocaleTimeString()}
          </div>
          <div>
            <span style={{ fontWeight: 'bold' }}>Medicines Loaded:</span> {medicines.length}
          </div>
          <div>
            <span style={{ fontWeight: 'bold' }}>Interval Active:</span> {intervalRefInterval.current ? '✅ Yes' : '❌ No'}
          </div>
          <div>
            <span style={{ fontWeight: 'bold' }}>Triggered Reminders:</span> {Object.keys(triggeredReminders).length}
          </div>
        </div>
        <div style={{ marginTop: '10px', fontSize: '0.85rem', color: '#7f8c8d' }}>
          💡 Open Browser DevTools (F12) → Console to see detailed logs. Look for [TRIGGER], [Snooze], or [ERROR] messages.
        </div>
      </div>

      {/* Add Medicine Form */}
      {showForm && (
        <div className="medicine-form-card">
          <h2>➕ Add New Medicine Reminder</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              {/* Medicine Name */}
              <div className="form-group">
                <label htmlFor="name">Medicine Name *</label>
                <input
                  id="name"
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="e.g., Aspirin"
                  required
                />
              </div>

              {/* Dosage */}
              <div className="form-group">
                <label htmlFor="dosage">Dosage *</label>
                <input
                  id="dosage"
                  type="text"
                  name="dosage"
                  value={form.dosage}
                  onChange={handleChange}
                  placeholder="e.g., 500mg, 1 tablet"
                  required
                />
              </div>

              {/* Time Input */}
              <div className="form-group">
                <label htmlFor="timeInput">Reminder Time (HH:MM)</label>
                <div className="time-input-group">
                  <input
                    id="timeInput"
                    type="time"
                    value={timeInput}
                    onChange={(e) => {
                      const timeStr = e.target.value.replace(":", ":");
                      setTimeInput(timeStr);
                    }}
                    placeholder="HH:MM"
                  />
                  <button type="button" onClick={addTime} className="btn-secondary">
                    Add Time
                  </button>
                </div>
              </div>
            </div>

            {/* Times List */}
            {form.times.length > 0 && (
              <div className="times-list">
                <h3>Selected Times:</h3>
                <div className="time-chips">
                  {form.times.map((time, idx) => (
                    <div key={idx} className="time-chip">
                      <span>🕐 {time}</span>
                      <button
                        type="button"
                        onClick={() => removeTime(time)}
                        className="remove-btn"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button type="submit" className="btn-success" disabled={loading}>
              {loading ? "Saving..." : "✓ Save Medicine"}
            </button>
          </form>
        </div>
      )}

      {/* Medicines List */}
      {medicines.length > 0 && (
        <div className="medicines-list">
          <h2>Your Medicines</h2>
          <div className="medicines-grid">
            {medicines.map((medicine) => (
              <div key={medicine.id} className="medicine-card">
                <div className="medicine-card-header">
                  <h3 className="medicine-name">💊 {medicine.name}</h3>
                  <button
                    onClick={() => handleDelete(medicine.id)}
                    className="btn-delete"
                    title="Delete medicine"
                  >
                    🗑️
                  </button>
                </div>

                <div className="medicine-details">
                  <p>
                    <strong>Dosage:</strong> {medicine.dosage}
                  </p>
                </div>

                <div className="reminder-times">
                  <h4>⏰ Reminder Times:</h4>
                  <div className="time-badges">
                    {medicine.times && medicine.times.length > 0 ? (
                      medicine.times.map((time, idx) => (
                        <span key={idx} className="time-badge">
                          {time}
                        </span>
                      ))
                    ) : (
                      <span className="empty-times">No times set</span>
                    )}
                  </div>
                </div>

                <div className="medicine-meta">
                  <small>
                    Added:{" "}
                    {new Date(medicine.createdAt).toLocaleDateString()}
                  </small>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {medicines.length === 0 && !showForm && (
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <h2>No Medicines Added Yet</h2>
          <p>Click "Add Medicine" to create your first medicine reminder.</p>
        </div>
      )}

      {/* Reminder Modal */}
      {activeReminder && (
        <div className="modal-overlay">
          <div className="reminder-modal">
            <div className="modal-content">
              <div className="reminder-icon">💊</div>
              <h2>Time to Take Your Medicine!</h2>

              <div className="reminder-details">
                <div className="reminder-field">
                  <span className="label">Medicine:</span>
                  <span className="value">{activeReminder.name}</span>
                </div>
                <div className="reminder-field">
                  <span className="label">Dosage:</span>
                  <span className="value">{activeReminder.dosage}</span>
                </div>
                <div className="reminder-field">
                  <span className="label">Scheduled Time:</span>
                  <span className="value">{activeReminder.time}</span>
                </div>
                <div className="reminder-field">
                  <span className="label">Current Time:</span>
                  <span className="value">
                    {new Date().toLocaleTimeString()}
                  </span>
                </div>
              </div>

              <div className="modal-actions">
                <button
                  onClick={handleTaken}
                  className="btn-taken"
                >
                  ✓ I've Taken It
                </button>
                <button
                  onClick={handleSnooze}
                  className="btn-snooze"
                >
                  ⏰ Snooze 5 min
                </button>
                <button
                  onClick={handleSkip}
                  className="btn-skip"
                >
                  ✕ Skip
                </button>
              </div>

              <p className="reminder-note">
                Snooze will remind you again in 5 minutes
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MedicineReminder;
