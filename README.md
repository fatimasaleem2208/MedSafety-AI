# 💊 MedSafety AI
### AI-Powered Medication Safety & Family Health Management Platform

MedSafety AI is a healthcare technology platform designed to help users understand their medications, manage family health information, analyze prescriptions and laboratory reports, and identify potential medication-related safety concerns.

The platform combines artificial intelligence, multilingual assistance, document analysis, and cloud-based health management tools in one user-friendly application.

## 🚀 Key Features

### 🤖 Multilingual AI Health Assistant
- AI-powered assistant using Google Gemini
- Supports English, Urdu, and Roman Urdu text conversations
- English voice interaction
- Medication information and general health education

### 💊 Smart Prescription Scanner
- Upload prescription images and PDF documents
- Capture prescriptions using a device camera
- Extract medicine names, strengths, and dosage instructions
- Identify potential medication interactions and allergy concerns
- Export extracted information as CSV

### 🧪 Lab Report Analyzer
- Upload laboratory reports in image or PDF format
- Extract laboratory test results
- Identify values outside supplied reference ranges
- Provide simplified explanations of laboratory findings
- Export extracted results as CSV

### 👨‍👩‍👧‍👦 Family Health Management
- Create and manage family member profiles
- Record medications and allergies
- Organize family health information
- Store supported records using Supabase

### ⏰ Medication Reminders
- Create medication schedules
- Track taken or skipped doses
- View medication history
- Browser notifications where supported

### 👩‍⚕️ Pharmacist Portal
- Pharmacist registration and professional verification workflow
- Role-based access to a pharmacist dashboard
- Review of submitted medication-related concerns
- Application status tracking

### 🔐 Authentication & Security
- Supabase email/password authentication
- Database Row Level Security policies
- Role-based pharmacist access
- Environment-based API key configuration

## 🛠️ Technology Stack

| Technology | Purpose |
|---|---|
| React + TypeScript | Frontend development |
| Vite | Development and build tooling |
| TanStack Router / Start | Routing and server functions |
| Tailwind CSS | User interface styling |
| Google Gemini API | AI-powered analysis and conversations |
| Supabase | Authentication and database |
| GitHub | Version control |
| Vercel | Application deployment |

## ⚙️ Local Installation

Clone the repository:

```bash
git clone https://github.com/YOUR_USERNAME/MedSafety-AI.git
cd MedSafety-AI
```

Install dependencies:

```bash
npm install
```

Create a `.env.local` file in the project root:

```env
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=your_supported_gemini_model

VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
```

Set up the required Supabase database tables and Row Level Security policies using the project's SQL migration files.

Start the application:

```bash
npm run dev
```

Open the localhost URL displayed in the terminal.

## 🔒 Privacy & Medical Disclaimer

MedSafety AI is an educational and development-stage healthcare application.

AI-generated information, prescription extraction, laboratory interpretation, and medication safety warnings may contain errors or omissions. They are not substitutes for evaluation by a qualified pharmacist or healthcare professional.

The application has not been clinically validated or independently certified for handling real patient information. Use fictional data for development and demonstrations until the required security, privacy, and clinical evaluations have been completed.

## 🎯 Future Improvements

- More natural Urdu and Roman Urdu speech
- Expanded medication-interaction databases
- Background medication notifications
- Additional pharmacist review tools
- Enhanced document analysis accuracy
- Security and clinical validation for real-world deployment

## 📌 Project Status

**Active Development — Functional Prototype**

MedSafety AI is being developed as an AI-assisted medication safety and family health management platform.

---

**MedSafety AI — Supporting safer medication awareness through intelligent technology.**