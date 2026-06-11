# 💊 MediTrack — Smart Medication & Health Management System

> Your Personal AI-Powered Health Companion

MediTrack is a full-stack web application that helps patients, elderly users, and individuals with chronic conditions manage their medications, monitor their health vitals, and stay connected with caregivers — all in one place.

---

## 📸 Screenshots

| Home Dashboard | Medications | Health Monitor |
|---|---|---|
| ![Home](screenshots/home.png) | ![Medications](screenshots/medications.png) | ![Health Monitor](screenshots/health-monitor.png) |

---

## 🚀 Features

### 🔐 User Authentication
- Register with name, email, age, and medical conditions
- Secure login via Firebase Authentication
- JWT session management and protected routes

### 💊 Medication Management
- Add medications with dosage, frequency, reminder time, and notes
- View medications in card layout with Pending / Taken status
- Mark as Taken or Delete medications

### ⏰ Smart Alarm System
- Real-time alarm checker running every second
- Supports both 12hr and 24hr time formats
- Alarm modal with sound (Web Audio API)
- Actions: Mark as Taken, Snooze 5 minutes, Dismiss
- Duplicate alarm prevention and browser push notifications

### 📱 WhatsApp Notifications
- Sends WhatsApp message when alarm triggers via Twilio API
- Reminds user to open app and mark medication as taken

### 🤖 AI Chatbot
- Powered by Groq AI (LLaMA 3.3 model)
- Answers health and medication questions intelligently
- Maintains conversation history with quick question shortcuts

### 🥗 AI-Powered Personalized Diet Plan
- Enter health profile (age, weight, height) and lab test results
- Auto-calculates BMI and detects health conditions
- Generates fully personalized diet plan using Groq AI
- Includes foods to eat/avoid, daily meal plan, and age-based tips
- Print diet plan option

### 📋 Medication History
- Complete log of all Taken, Missed, and Snoozed medications
- Filter by status with adherence score and progress bar
- Export history to Excel file

### 👨‍⚕️ Caregiver Dashboard
- Patient profile, adherence score, and last 7 days activity chart
- Tabs: Overview, Medications, History, Patterns
- Alert banner for consecutive missed doses
- Export Excel report or send automatically to caregiver email

### 🔬 Health Monitor — ML Features

**Anomaly Detection (Z-Score Algorithm)**
- Enter daily readings: BP, Blood Sugar, Heart Rate, Temperature
- Z-Score algorithm classifies readings as Normal / Warning / Critical

**Symptom Checker (Naive Bayes Algorithm)**
- Select or type symptoms
- Predicts top 3 possible diseases with match percentage
- Severity classification: Mild / Moderate / Serious

### 🏃 Exercise Page
- Personalized exercise plans based on health condition and fitness level
- Supports General, Diabetes, and Hypertension conditions
- Beginner, Intermediate, and Advanced levels

### 🏠 Home Dashboard
- Today's medication stats, health tip of the day, and feature highlights

---

## 🤖 AI/ML Technologies

| Feature | Technology | Category |
|---|---|---|
| Chatbot | Groq LLaMA 3.3 | Generative AI / NLP |
| Diet Plan | Groq LLaMA 3.3 | Generative AI |
| Condition Detection | Rule-Based Expert System | Medical AI |
| Anomaly Detection | Z-Score Algorithm | Machine Learning |
| Symptom Checker | Naive Bayes Algorithm | Machine Learning |
| Alarm System | Time-Based Polling | Rule-Based AI |
| BMI Classification | Threshold Classifier | ML Classification |
| Adherence Score | Statistical Analysis | Predictive Analytics |

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React.js, Redux, React Router |
| **Authentication** | Firebase Authentication |
| **Backend** | Node.js, Express.js, REST API |
| **AI/ML** | Groq API (LLaMA 3.3), Z-Score, Naive Bayes |
| **Notifications** | Twilio WhatsApp API, Nodemailer (Gmail) |
| **Database** | Firebase Firestore, In-Memory Storage |
| **Other** | XLSX (Excel Export), Web Audio API, Browser Notifications |

---

## 📁 Project Structure

```
meditrack/
├── client/                  # React Frontend
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/           # Page components
│   │   │   ├── Home.jsx
│   │   │   ├── Medications.jsx
│   │   │   ├── Chat.jsx
│   │   │   ├── Diet.jsx
│   │   │   ├── Exercise.jsx
│   │   │   ├── History.jsx
│   │   │   ├── HealthMonitor.jsx
│   │   │   ├── Caregiver.jsx
│   │   │   └── Profile.jsx
│   │   ├── redux/           # Redux state management
│   │   ├── firebase.js      # Firebase config
│   │   └── App.jsx
├── server/                  # Node.js Backend
│   ├── routes/
│   │   ├── medications.js
│   │   ├── notifications.js
│   │   ├── diet.js
│   │   └── caregiver.js
│   ├── utils/
│   │   ├── whatsapp.js      # Twilio integration
│   │   ├── email.js         # Nodemailer integration
│   │   └── excel.js         # XLSX export
│   └── index.js
├── .env
├── package.json
└── README.md
```

---

## ⚙️ Installation & Setup

### Prerequisites
- Node.js v18+
- npm or yarn
- Firebase project
- Groq API key
- Twilio account (WhatsApp Sandbox)
- Gmail account (for Nodemailer)

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/meditrack.git
cd meditrack
```

### 2. Install Dependencies

**Backend:**
```bash
cd server
npm install
```

**Frontend:**
```bash
cd client
npm install
```

### 3. Environment Variables

Create a `.env` file in the `server/` directory:

```env
# Groq AI
GROQ_API_KEY=your_groq_api_key

# Twilio WhatsApp
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886

# Nodemailer Gmail
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_gmail_app_password

# Firebase (if using Admin SDK)
FIREBASE_PROJECT_ID=your_project_id
```

Create a `.env` file in the `client/` directory:

```env
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_auth_domain
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_storage_bucket
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
```

### 4. Run the Application

**Start Backend:**
```bash
cd server
npm start
# Runs on http://localhost:5000
```

**Start Frontend:**
```bash
cd client
npm start
# Runs on http://localhost:3000
```

---

## 🔑 Key Pages & Routes

| Route | Page |
|---|---|
| `/login` | Login / Register |
| `/` | Home Dashboard |
| `/medications` | Medication Management |
| `/chat` | AI Health Chatbot |
| `/diet` | AI Diet Plan Generator |
| `/exercise` | Exercise Recommendations |
| `/history` | Medication History |
| `/health-monitor` | Anomaly Detection + Symptom Checker |
| `/caregiver` | Caregiver Dashboard |
| `/profile` | Profile & Settings |

---

## 📊 How the ML Algorithms Work

### Z-Score Anomaly Detection
```
Z = (X - μ) / σ

Where:
  X = current reading
  μ = mean of past readings
  σ = standard deviation

Result:
  |Z| < 1     → Normal ✅
  1 ≤ |Z| < 2 → Warning ⚠️
  |Z| ≥ 2     → Critical 🚨
```

### Naive Bayes Symptom Checker
```
P(Disease | Symptoms) ∝ P(Symptoms | Disease) × P(Disease)

- Each symptom is treated as an independent feature
- Top 3 diseases ranked by probability score
- Match percentage displayed for each prediction
```

---

## 📧 Caregiver Email Report

The system automatically generates an Excel report containing:
- Medication name, dosage, frequency
- Status (Taken / Missed / Snoozed)
- Date and time of each record
- Medications not yet taken

The report is sent to the caregiver's email via **Nodemailer + Gmail SMTP**.

---

## 🙏 Acknowledgements

- [Groq AI](https://groq.com/) — LLaMA 3.3 model for chatbot and diet plan
- [Twilio](https://www.twilio.com/) — WhatsApp notification API
- [Firebase](https://firebase.google.com/) — Authentication and Firestore
- [Nodemailer](https://nodemailer.com/) — Email delivery
- [SheetJS (XLSX)](https://sheetjs.com/) — Excel export

---

## 👩‍💻 Developed By

**Amulya** — MediTrack Project  
B.Tech CSE | 2026  

---

> ⚠️ **Disclaimer:** MediTrack is a health assistance tool and is not a substitute for professional medical advice. Always consult a qualified healthcare provider for medical decisions.
