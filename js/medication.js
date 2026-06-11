function checkAlarms() {
    const now = new Date();
    if (now.getSeconds() !== 0) return;

    const hh  = String(now.getHours()).padStart(2, '0');
    const mm  = String(now.getMinutes()).padStart(2, '0');
    const current24 = `${hh}:${mm}`;

    // Convert 12hr to 24hr for comparison
    function to24hr(timeStr) {
        if (!timeStr) return '';
        timeStr = timeStr.trim();

        // Already in 24hr format like "14:30"
        if (!timeStr.includes('AM') && !timeStr.includes('PM') &&
            !timeStr.includes('am') && !timeStr.includes('pm')) {
            return timeStr.substring(0, 5);
        }

        // Convert 12hr format like "2:30 PM" or "2:30PM"
        const [time, modifier] = timeStr.toUpperCase().replace('AM','|AM').replace('PM','|PM').split('|');
        let [hours, minutes] = time.trim().split(':');
        hours = parseInt(hours);
        minutes = minutes ? minutes.trim() : '00';

        if (modifier === 'AM') {
            if (hours === 12) hours = 0;
        } else if (modifier === 'PM') {
            if (hours !== 12) hours += 12;
        }

        return `${String(hours).padStart(2,'0')}:${String(minutes).padStart(2,'0')}`;
    }

    medications.forEach(med => {
        const alarmKey = med.id + current24;
        if (activeAlarmIds.has(alarmKey)) return;

        const snoozeUntil = snoozedAlarms[med.id];
        if (snoozeUntil && Date.now() < snoozeUntil) return;

        const medTime24 = to24hr(med.time);

        if (medTime24 === current24) {
            activeAlarmIds.add(alarmKey);
            triggerAlarm(med);
        }
    });
}