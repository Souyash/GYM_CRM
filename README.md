# 🛡️ IronVault — Zero-Hardware Smart Gym CRM & Multi-Tenant SaaS Platform

[![Vercel Deployment](https://img.shields.io/badge/Frontend-Vercel%20Live-brightgreen?logo=vercel)](https://gym-crm-indol.vercel.app)
[![Render Backend](https://img.shields.io/badge/Backend-Render%20Online-informational?logo=render)](https://gym-crm-ejgf.onrender.com/api/health)
[![Capacitor iOS](https://img.shields.io/badge/Mobile%20App-Capacitor%20%7C%20iOS%20%26%20Android-blue?logo=apple)](https://capacitorjs.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue?logo=typescript)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**IronVault** is a production-ready, multi-tenant cloud SaaS and mobile CRM platform designed for modern gyms, fitness clubs, and boutique studios. It eliminates thousands of dollars in turnstile scanners, biometric access systems, and proprietary hardware by using an intelligent **"Member-Scans-Facility"** anti-fraud security engine.

---

## 🌐 Live Production Deployments & Links

| Service | Environment | Live URL |
| :--- | :--- | :--- |
| **Official Web Application** | Vercel (Production) | [gym-crm-indol.vercel.app](https://gym-crm-indol.vercel.app) |
| **Client Onboarding & User Manual Video** | Vercel Interactive Presentation | [gym-crm-indol.vercel.app/onboarding-presentation.html](https://gym-crm-indol.vercel.app/onboarding-presentation.html) |
| **Cloud REST API & WebSockets** | Render (Docker/Node.js) | [gym-crm-ejgf.onrender.com/api](https://gym-crm-ejgf.onrender.com/api) |
| **API Health Status** | Cloud Heartbeat | [gym-crm-ejgf.onrender.com/api/health](https://gym-crm-ejgf.onrender.com/api/health) |
| **Native Mobile App Project** | Capacitor (Xcode / Android Studio) | `client/ios/App` & `client/android` |

---

## 👑 Official Platform Super Admin Access

The system is configured with a single root platform Super Admin identity:

| Parameter | Value |
| :--- | :--- |
| **Email / Username** | `superadmin@ironvault.com` |
| **Password** | `superadmin123` |
| **Role** | `SUPER_ADMIN` (Platform Owner) |
| **Convenience Feature** | One-click **"Autofill Super Admin"** button directly on the staff login screen |

---

## ⚡ Key Pillars & Features

```
                               ┌────────────────────────────────┐
                               │     IronVault Multi-Tenant     │
                               │        SaaS Platform           │
                               └───────────────┬────────────────┘
                                               │
               ┌───────────────────────────────┼───────────────────────────────┐
               ▼                               ▼                               ▼
    ┌────────────────────┐          ┌────────────────────┐          ┌────────────────────┐
    │   SUPER ADMIN      │          │   GYM OWNER        │          │   ATHLETE / MEMBER │
    │   Global Control   │          │   Gym Workspace    │          │   Mobile Experience│
    ├────────────────────┤          ├────────────────────┤          ├────────────────────┤
    │ • Multi-Gym Tenant │          │ • 6-Digit Code &   │          │ • Digital Pass     │
    │   Management       │          │   Client Invite Link│         │ • Camera Scanner   │
    │ • Platform MRR &   │          │ • Live Attendance  │          │ • Workout Logs     │
    │   Global Metrics   │          │ • Desk Billing &   │          │ • Health Onboarding│
    │ • Threat Alerts &  │          │   Active Passes    │          │ • Social Community │
    │   Device Approvals │          │ • Printable Posters│          │   Feed & Challenges│
    └────────────────────┘          └────────────────────┘          └────────────────────┘
```

### 1. 🏢 Multi-Tenant SaaS Architecture
- **Dedicated Gym Workspaces**: Each gym operates as an isolated tenant with its own branding, members, staff, attendance entries, and billing passes.
- **6-Digit Access Code (`inviteCode`)**: Each registered gym receives a unique numeric code (e.g. `100001`) for client onboarding.
- **1-Click Invite Link**: Gym owners can copy their custom signup link (e.g. `?invite=100001`) to distribute on Instagram, WhatsApp, or flyers.
- **Tenant Data Isolation**: Database queries enforce strict tenant separation (`where: { gymId: callerGymId }`).

### 2. 📱 Native Cross-Platform Mobile Experience (iOS & Android)
- **Capacitor Integration**: Packaged as native iOS (`.xcworkspace` / `.xcodeproj`) and Android projects.
- **iPhone Notch & Dynamic Island Optimization**: Fully supports edge-to-edge screens, automatically accounting for 44px notches and 54px–59px Dynamic Islands (`env(safe-area-inset-top)` / `bottom-notch-safe`).
- **Persistent Sessions**:
  - **Gym Owners & Super Admins**: Stay logged in permanently (10-year session) until they explicitly sign out or uninstall.
  - **Members**: Stay logged in seamlessly on their phone as long as their subscription pass remains active. Automatic sign-out occurs if a pass expires or if their record is removed from the database.

### 3. 🛡️ 4-Tier Zero-Hardware Anti-Fraud Access Engine
Traditional turnstiles cost $3,000–$10,000+. IronVault replaces hardware with static printed QR posters and software validation:
1. **GPS Geolocation Locking**: Verifies that the member's physical device is within **50 meters** of the facility coordinates using the Haversine formula.
2. **Hardware Device Binding**: On first login, locks the account to that device's unique hardware footprint (`x-device-id`).
3. **Multi-Device Fraud Detection**: If a credential is used on an unapproved phone, access is blocked and an instant alert ticket is pushed to the manager panel.
4. **Anti-Passback Cooldown**: Prevents sharing passes by enforcing a 3-minute cooldown between check-ins.
5. **Exit Turnstile Tracking**: Members scan the departure poster to record workout duration and conclude their visit.

### 4. 🖨️ Printable QR Turnstile Posters
- High-resolution, vector-crisp QR posters for:
  - **🟢 Entrance Gate Poster**: Scanned by members to check in.
  - **🏁 Exit Turnstile Poster**: Scanned upon leaving to calculate workout duration.
- Includes automatic multi-gym selector for owners managing multiple facilities.
- One-click print-ready styling for lobby display.

### 5. 💳 Front Desk Billing & Subscription Management
- **Instant Plan Assignment**: 1-month, 3-month, 6-month, and Annual VIP passes.
- **Real-Time Access Granting**: Immediate activation of member QR passes upon payment.
- **Member Directory**: Search by name or phone, view valid-until dates, or remove members with automatic session revocation.

### 6. 📊 Health Intelligence & Sales Lead Engine
- Comprehensive health intake: Goal, activity level, fitness background, dietary preferences, injuries, and biometric stats.
- Automated calculation of **BMI**, **BMR**, and **TDEE**.
- Lead scoring with automated one-click **WhatsApp Sales Outreach** for membership upselling.

### 7. 💬 Community Feed & Social Buzz
- Gym-wide announcement channel for WODs, notices, and PR celebrations.
- Member interaction with likes, high-fives, and motivational comments.

---

## 🛠️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend Framework** | React 18, TypeScript, Vite |
| **Styling & UI** | Tailwind CSS, Lucide Icons, Glassmorphism, Dark/Light Mode |
| **Mobile Runtime** | Capacitor 7 (iOS Xcode & Android Studio) |
| **Camera & QR Engine** | `@zxing/library`, `qrcode`, HTML5 Canvas video pipeline |
| **Backend API** | Node.js, Express.js (ES Modules), TypeScript |
| **Database & ORM** | Prisma ORM, SQLite (`dev.db`) / PostgreSQL compatible |
| **Real-Time Sync** | Socket.IO (WebSockets) |
| **Authentication** | JWT (JSON Web Tokens), bcryptjs, Device ID fingerprinting |
| **Transactional Email** | Nodemailer (Gmail SMTP) & Resend / Brevo fallback |
| **Hosting & CI/CD** | Vercel (Frontend), Render (Backend & WebSockets) |

---

## 📂 Project Structure

```
CRM/
├── client/                          # React + Vite Frontend & Capacitor Mobile App
│   ├── ios/                         # Native Xcode iOS Project (App.xcworkspace)
│   ├── android/                     # Native Android Studio Project
│   ├── public/
│   │   ├── onboarding-presentation.html  # Interactive Client Onboarding & Video Deck
│   │   └── favicon.svg
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.tsx           # Notch-safe responsive navigation
│   │   │   ├── MobileBottomNav.tsx  # Mobile thumb navigation bar
│   │   │   ├── PrintableFacilityQR.tsx # Turnstile poster printer & switcher
│   │   │   ├── ScannerModal.tsx     # Member QR camera scanner
│   │   │   ├── CommunityFeed.tsx    # Social gym feed & announcements
│   │   │   └── RedAlertBanner.tsx   # Real-time WebSocket security alerts
│   │   ├── context/
│   │   │   └── AuthContext.tsx      # Auth state & long-term session persistence
│   │   ├── services/
│   │   │   ├── api.ts               # API client with auto-prewarm & 45s timeout
│   │   │   ├── socket.ts            # Socket.IO real-time client
│   │   │   └── device.ts            # Hardware device fingerprinting
│   │   ├── views/
│   │   │   ├── LandingPageView.tsx  # High-converting public homepage
│   │   │   ├── LoginView.tsx        # Multi-role authentication & onboarding
│   │   │   ├── SuperAdminDashboard.tsx # Global SaaS tenant oversight
│   │   │   ├── ManagerDashboard.tsx # Gym Owner attendance & floor manager
│   │   │   ├── MemberProfile.tsx    # Athlete digital pass & visit history
│   │   │   └── HealthIntelligenceView.tsx # Health analytics & leads hub
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── capacitor.config.ts          # Capacitor mobile configuration
│   └── package.json
│
├── server/                          # Express + TypeScript Backend
│   ├── prisma/
│   │   ├── schema.prisma            # Multi-tenant Gym & Member models
│   │   ├── seed.ts                  # Clean database seeding script
│   │   └── dev.db                   # SQLite database file
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── auth.controller.ts   # Login, OTP verification, register business
│   │   │   ├── gym.controller.ts    # Tenant lookup & multi-gym operations
│   │   │   ├── facility.controller.ts # Auto-seed turnstile posters & geofencing
│   │   │   ├── entry.controller.ts  # 4-tier security validation pipeline
│   │   │   ├── membership.controller.ts # Desk billing & member management
│   │   │   └── community.controller.ts # Social announcements & posts
│   │   ├── middleware/
│   │   │   └── auth.middleware.ts   # JWT & tenant gymId resolution
│   │   ├── routes/                  # Express route definitions
│   │   ├── utils/                   # Prisma client, mailer & logger
│   │   ├── app.ts                   # Express application factory
│   │   └── server.ts                # HTTP + Socket.IO server entrypoint
│   └── package.json
│
├── start-mac.command                # 1-Click macOS Finder Launcher script
└── README.md                        # Project documentation
```

---

## 🚀 Getting Started (Local Development)

### Prerequisites
- **Node.js**: v18.0.0 or later
- **npm**: v9.0.0 or later
- **Git**

### 1. Clone the Repository
```bash
git clone https://github.com/Souyash/GYM_CRM.git
cd GYM_CRM
```

### 2. Backend Setup
```bash
cd server
npm install
npx prisma generate
npx prisma db push
npm run dev
```
The server will start at `http://localhost:5001`.

### 3. Frontend Setup
In a new terminal window:
```bash
cd client
npm install
npm run dev
```
The application will be accessible at `http://localhost:5173`.

### 4. One-Click macOS Launcher
If you are on a Mac, you can double-click [`start-mac.command`](file:///Users/souyashbiswas/Desktop/numPY%20practice/CRM/start-mac.command) from Finder to automatically initialize dependencies, apply database migrations, and launch both frontend and backend servers simultaneously.

---

## 📱 Running the Native iOS App (Xcode)

1. Navigate to the client directory and build web assets:
   ```bash
   cd client
   npm run build
   npx cap sync ios
   ```
2. Open the native workspace in Xcode:
   ```bash
   npx cap open ios
   ```
3. In Xcode:
   - Select your target simulator (e.g. **iPhone 16 Pro** or **iPhone 15**).
   - Press **⌘ + R** to run.
   - The app runs in native WebKit with hardware safe area insets and camera permissions configured.

---

## ⚙️ Environment Variables

### Backend (`server/.env`)
```env
PORT=5001
JWT_SECRET="your-super-secure-jwt-secret-key"
DATABASE_URL="file:./dev.db"
CLIENT_ORIGIN="http://localhost:5173"

# Optional Email Configuration for OTP Passcodes
GMAIL_USER="your-email@gmail.com"
GMAIL_APP_PASSWORD="your-16-char-app-password"
EMAIL_FROM_NAME="IronVault Fitness"
```

### Frontend (`client/.env`)
```env
# Point to local server or deployed Render cloud backend
VITE_API_URL="https://gym-crm-ejgf.onrender.com/api"
```

---

## 🧪 Testing the Onboarding & Turnstile Flows

### Flow A: Gym Owner Onboarding
1. Go to the home page and click **"Gym Owner"** $\to$ **"Register Business"**.
2. Enter business name, owner details, address, and password.
3. System provisions a new isolated gym tenant, generates a 6-digit access code (e.g. `100001`), and signs you into the **Manager Dashboard**.
4. Navigate to **QR Poster** to view and print your entrance and exit posters.

### Flow B: Athlete Joining a Gym
1. From the login view, select **"Join Gym"**.
2. Enter the gym's 6-digit access code (e.g. `100001`).
3. Fill in name, email, and password.
4. Member profile is created, bound to the member's smartphone, and displayed in the gym's athlete roster.

### Flow C: Smart QR Turnstile Check-In
1. Open the app as a member and click the central **"Check In"** button.
2. Allow camera access and point the lens at the **Entrance Gate Poster**.
3. The 4-tier anti-fraud engine verifies location, active pass, hardware ID, and cooldown.
4. **"ACCESS GRANTED"** chime plays, and the member instantly appears on the gym staff's **Live Attendance** feed via WebSockets.

---

## 📄 License
This project is open-source software licensed under the [MIT License](LICENSE).
