// Dashboard Analytics Functions

let dashboardData = {};

async function loadDashboardData() {
    try {
        const response = await fetch(`${API_URL}/dashboard/analytics`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (response.ok) {
            dashboardData = await response.json();
            updateDashboard();
        }
    } catch (error) {
        console.error('Error loading dashboard data:', error);
    }
}

function updateDashboard() {
    // Update stats
    document.getElementById('adherence-rate').textContent = 
        dashboardData.adherenceRate ? `${dashboardData.adherenceRate}%` : '0%';
    document.getElementById('meds-taken').textContent = 
        dashboardData.medicationsTaken || 0;
    document.getElementById('meds-missed').textContent = 
        dashboardData.medicationsMissed || 0;
    document.getElementById('streak-days').textContent = 
        dashboardData.streakDays || 0;
    
    // Update charts
    updateWeeklyChart();
    updateMedicationChart();
    
    // Update activity log
    displayActivityLog();
}

function updateWeeklyChart() {
    const ctx = document.getElementById('weeklyChart');
    if (!ctx) return;
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            datasets: [{
                label: 'Adherence %',
                data: dashboardData.weeklyAdherence || [0, 0, 0, 0, 0, 0, 0],
                backgroundColor: 'rgba(102, 126, 234, 0.7)',
                borderColor: 'rgba(102, 126, 234, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100
                }
            }
        }
    });
}

function updateMedicationChart() {
    const ctx = document.getElementById('medicationChart');
    if (!ctx) return;
    
    const medicationNames = dashboardData.medications ? dashboardData.medications.map(m => m.name) : [];
    const medicationCounts = dashboardData.medications ? dashboardData.medications.map(m => m.count) : [];
    
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: medicationNames,
            datasets: [{
                data: medicationCounts,
                backgroundColor: [
                    'rgba(102, 126, 234, 0.7)',
                    'rgba(118, 75, 162, 0.7)',
                    'rgba(255, 99, 132, 0.7)',
                    'rgba(54, 162, 235, 0.7)'
                ]
            }]
        },
        options: {
            responsive: true
        }
    });
}

function displayActivityLog() {
    const activityLog = document.getElementById('activity-log');
    if (!activityLog || !dashboardData.activities) return;
    
    activityLog.innerHTML = '';
    dashboardData.activities.forEach(activity => {
        const activityItem = document.createElement('div');
        activityItem.className = 'activity-item';
        activityItem.innerHTML = `
            <p>${activity.description}</p>
            <span class="time">${new Date(activity.timestamp).toLocaleString()}</span>
        `;
        activityLog.appendChild(activityItem);
    });
}

// Load dashboard data on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadDashboardData);
} else {
    loadDashboardData();
}
