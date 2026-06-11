const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");
const XLSX = require("xlsx");
const twilio = require("twilio");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5001;

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const corsOptions = {
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-User-ID"],
  credentials: false,
};

app.use(cors(corsOptions));
app.use(express.json());

let users = [];
let medications = [];
let intakeLogs = [];

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_MODEL = "llama-3.3-70b-versatile";
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const userId = req.headers["x-user-id"] || "guest-user";
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  req.userId = userId;
  next();
};

app.get("/", (req, res) => res.send("MediTrack Backend Running"));

app.post("/api/auth/signup", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: "Email and password required" });
  const existingUser = users.find(u => u.email === email);
  if (existingUser) return res.status(400).json({ message: "User already exists" });
  const newUser = { id: Date.now().toString(), email, password, name: email.split("@")[0] };
  users.push(newUser);
  res.json({ message: "Signup successful", token: "dummy-token", user: newUser });
});

app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;
  const user = users.find(u => u.email === email && u.password === password);
  if (!user) return res.status(401).json({ message: "Invalid credentials" });
  res.json({ message: "Login successful", token: "dummy-token", user });
});

app.get("/api/medications", authMiddleware, (req, res) => {
  res.json({ medications: medications.filter(m => m.userId === req.userId) });
});

app.post("/api/medications", authMiddleware, (req, res) => {
  const medication = req.body;
  if (!medication.name || !medication.dosage || !medication.reminderTime) {
    return res.status(400).json({ message: "Name, dosage and reminderTime are required" });
  }
  const newMed = {
    id: Date.now().toString(),
    userId: req.userId,
    name: medication.name,
    dosage: medication.dosage,
    frequency: medication.frequency || "Once daily",
    reminderTime: medication.reminderTime,
    startDate: medication.startDate || new Date().toISOString().split("T")[0],
    notes: medication.notes || "",
    status: medication.status || "scheduled",
  };
  medications.push(newMed);
  res.json({ success: true, message: "Medication added", medication: newMed });
});

app.put("/api/medications/:id", authMiddleware, (req, res) => {
  const med = medications.find(m => m.id === req.params.id && m.userId === req.userId);
  if (!med) return res.status(404).json({ message: "Medication not found" });
  const { status, reminderTime, name, dosage } = req.body;
  if (status) med.status = status;
  if (reminderTime) med.reminderTime = reminderTime;
  if (name) med.name = name;
  if (dosage) med.dosage = dosage;
  res.json({ success: true, medication: med });
});

app.delete("/api/medications/:id", authMiddleware, (req, res) => {
  const index = medications.findIndex(m => m.id === req.params.id && m.userId === req.userId);
  if (index === -1) return res.status(404).json({ message: "Medication not found" });
  medications.splice(index, 1);
  intakeLogs = intakeLogs.filter(log => log.medId !== req.params.id);
  res.json({ success: true, message: "Medication deleted" });
});

app.get("/api/history", authMiddleware, (req, res) => {
  res.json({
    intakeLogs: intakeLogs.filter(l => l.userId === req.userId),
    medications: medications.filter(m => m.userId === req.userId),
  });
});

app.post("/api/history", authMiddleware, (req, res) => {
  const { medId, status, timestamp } = req.body;
  if (!medId || !status || !timestamp) return res.status(400).json({ message: "medId, status, and timestamp required" });
  const medication = medications.find(m => m.id === medId && m.userId === req.userId);
  if (!medication) return res.status(404).json({ message: "Medication not found" });
  const log = { id: Date.now().toString(), userId: req.userId, medId, medName: medication.name, status, timestamp };
  intakeLogs.push(log);
  res.json({ success: true, log });
});

app.get("/api/dashboard/analytics", authMiddleware, (req, res) => {
  const userMeds = medications.filter(m => m.userId === req.userId);
  const userLogs = intakeLogs.filter(l => l.userId === req.userId);
  const taken = userLogs.filter(l => l.status === "taken").length;
  const missed = userLogs.filter(l => l.status === "missed").length;
  res.json({
    totalMedications: userMeds.length,
    medicationsTaken: taken,
    medicationsMissed: missed,
    adherenceRate: userMeds.length > 0 ? Math.round((taken / userMeds.length) * 100) : 0,
    weeklyAdherence: [90, 80, 70, 85, 95, 90, 88],
    medications: userMeds.map(m => ({ name: m.name, count: userLogs.filter(l => l.medId === m.id && l.status === "taken").length })),
    activities: userLogs.slice(-20).reverse().map(l => ({ description: `${l.medName} marked ${l.status}`, timestamp: l.timestamp })),
    streakDays: 0,
  });
});

app.post("/api/chat/message", authMiddleware, (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ reply: "Please send a message." });
  const msg = message.toLowerCase();
  let reply = "I can help with medication reminders and health tips.";
  if (msg.includes("hello") || msg.includes("hi")) reply = "Hello! How can I help with your health today?";
  else if (msg.includes("paracetamol")) reply = "Paracetamol is used to reduce pain and fever. Take as directed.";
  else if (msg.includes("missed") || msg.includes("forgot")) reply = "If you missed a dose, take it if not close to your next dose, otherwise skip it.";
  else if (msg.includes("diet")) reply = "Eat balanced meals with vegetables, proteins, and whole grains.";
  res.json({ reply });
});

app.post("/api/notify/sms", authMiddleware, async (req, res) => {
  const { userPhone, medName, dosage } = req.body;
  if (!userPhone || !medName) return res.status(400).json({ message: "userPhone and medName required" });
  try {
    const message = await twilioClient.messages.create({
      from: "whatsapp:+14155238886",
      to: `whatsapp:+91${userPhone}`,
      contentSid: "HXb5b62575e6e4ff6129ad7c8efe1f983e",
      contentVariables: JSON.stringify({ "1": medName, "2": dosage }),
    });
    res.json({ success: true, sid: message.sid });
  } catch (err) {
    console.error("WhatsApp error:", err.message);
    res.status(500).json({ message: "WhatsApp failed", error: err.message });
  }
});

app.post("/api/notify/caregiver-report", authMiddleware, async (req, res) => {
  const { caregiverEmail, userName } = req.body;
  if (!caregiverEmail) return res.status(400).json({ message: "caregiverEmail is required" });
  try {
    const userLogs = intakeLogs.filter(l => l.userId === req.userId);
    const userMeds = medications.filter(m => m.userId === req.userId);
    const reportData = userLogs.map(log => ({
      "Medication Name": log.medName,
      "Status": log.status.toUpperCase(),
      "Date & Time": new Date(log.timestamp).toLocaleString(),
    }));
    userMeds.forEach(med => {
      if (!userLogs.find(l => l.medId === med.id)) {
        reportData.push({ "Medication Name": med.name, "Status": "NOT TAKEN YET", "Date & Time": "-" });
      }
    });
    const worksheet = XLSX.utils.json_to_sheet(reportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Medication Report");
    const excelBuffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
      tls: { rejectUnauthorized: false },
    });
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: caregiverEmail,
      subject: `Medication Report for ${userName || "Patient"}`,
      text: `Please find the attached medication report for ${userName || "your patient"}.`,
      attachments: [{
        filename: `medication-report.xlsx`,
        content: excelBuffer,
        contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      }],
    });
    res.json({ success: true, message: "Report sent to caregiver" });
  } catch (err) {
    console.error("Email error:", err.message);
    res.status(500).json({ message: "Failed to send report", error: err.message });
  }
});

app.post("/api/ai/diet", authMiddleware, async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ message: "prompt is required" });
  console.log("Diet plan request from:", req.userId);
  try {
    const response = await fetch(GROQ_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${GROQ_API_KEY}` },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          { role: "system", content: "You are healthassistant, a clinical dietitian. Generate detailed personalized diet plans based on patient health conditions." },
          { role: "user", content: prompt },
        ],
        max_tokens: 1500,
      }),
    });
    const data = await response.json();
    if (data.error) { console.error("Groq diet error:", data.error.message); return res.status(500).json({ message: data.error.message }); }
    res.json({ success: true, result: data.choices[0].message.content });
  } catch (err) {
    console.error("Diet error:", err.message);
    res.status(500).json({ message: err.message });
  }
});

app.post("/api/ai/chat", authMiddleware, async (req, res) => {
  const { messages } = req.body;
  if (!messages || !Array.isArray(messages)) return res.status(400).json({ message: "messages array required" });
  console.log("Chat request from:", req.userId);
  try {
    const response = await fetch(GROQ_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${GROQ_API_KEY}` },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          { role: "system", content: "You are healthassistant, an intelligent healthcare companion in MediTrack. Help with medication questions, health tips, diet advice, and wellness. Be friendly and always recommend consulting a doctor for serious concerns." },
          ...messages,
        ],
        max_tokens: 1000,
      }),
    });
    const data = await response.json();
    if (data.error) { console.error("Groq chat error:", data.error.message); return res.status(500).json({ message: data.error.message }); }
    res.json({ success: true, reply: data.choices[0].message.content });
  } catch (err) {
    console.error("Chat error:", err.message);
    res.status(500).json({ message: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`MediTrack server running on port ${PORT}`);
  console.log(`Groq model: ${GROQ_MODEL}`);
  console.log(`Groq API Key: ${GROQ_API_KEY ? "LOADED" : "MISSING"}`);
});