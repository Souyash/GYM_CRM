# 🛡️ IronVault - Hardware-Free Smart Gym CRM System

An end-to-end, automated Gym Customer Relationship Management (CRM) system engineered with a mobile-first, dark-mode frontend (React, Vite, Tailwind CSS) and a robust backend (Node.js, Express, TypeScript, Prisma ORM, SQLite, Socket.IO).

---

## ⚡ Key Highlights

### 🍎 Dedicated Apple MacBook (macOS) Experience
- **Auto-Hardware Detection**: Detects MacBook Pro / MacBook Air hardware profile, Apple Silicon / Intel architecture, and Retina resolutions.
- **FaceTime HD Camera Support**: Scanner automatically queries and prioritizes the MacBook FaceTime HD Camera (`user` video input), eliminating rear-camera constraint failures on macOS.
- **Double-Click macOS Launcher**: Launch directly from macOS Finder via [`start-mac.command`](file:///Users/souyashbiswas/Desktop/numPY%20practice/CRM/start-mac.command).
- **macOS Keyboard Shortcuts**: Press **`⌘ + S`** anywhere to open the Smart Camera Scanner, or **`⌘ + K`** to open the quick test persona switcher.
- **Pre-Configured MacBook Persona**: **Alex Rivera (MacBook User)** with an active Annual VIP pass pre-bound to Apple MacBook Pro hardware.

### 1. Hardware-Free "Member-Scans-Facility" Smart Access
- **No Turnstile Hardware or Dynamic QR Readers Needed**: A single, static, unchanging QR code is printed and posted permanently at the physical entrance.
- **Mobile & MacBook Scanner UI**: Members scan the physical facility QR code using their smartphone or MacBook webcam (`html5-qrcode` camera scanner).
- **Real-Time WebSocket Sync**: Verified entries instantly pop on the Staff Manager's live attendance dashboard with member avatar, plan name, and timestamp.

### 2. Core 4-Tier Anti-Fraud Security Pipeline
The backend executes checks strictly in this order before validating any scan:
1. **GPS Geolocation Locking**: Validates that the device's physical coordinates fall within a **50-meter geofence** of the gym address using the Haversine formula. Rejects if outside.
2. **Strict Device Binding**: On first login, permanently binds the user profile to their smartphone hardware ID (`x-device-id`).
3. **Multi-Device Login Detection**: If a login occurs from an unregistered Device ID, the account is temporarily flagged, access is blocked, and a WebSocket alert is pushed to the Super Admin panel requiring manual **"Approve Device Change"** resolution.
4. **Anti-Passback Cooldown Timer**: After a valid check-in, locks the user's profile for **3 minutes** to prevent badge passing.
5. **Active Subscription Verification**: Rejects expired or inactive memberships and fires threat alerts.

### 3. Threat Monitoring & Instant Alerting
- **Drop-Down Red Alert Banner**: Appears immediately on the Super Admin dashboard via WebSockets on any security breach (`GPS_GEOFENCE_BREACH`, `MULTI_DEVICE_BLOCKED`, `EXPIRED_MEMBERSHIP`, `ANTI_PASSBACK_LOCKED`).
- **Asynchronous Webhook & SMS/Email Dispatching**: Automatically dispatches alerts to the facility owner with member name, timestamp, and incident reason.

---

## 🚀 Running the System

Both backend and frontend servers are configured and running:

| Service | Port / URL | Description |
| :--- | :--- | :--- |
| **Backend API & WebSockets** | `http://localhost:5001` | Express API, Socket.IO, Prisma ORM, Anti-Fraud Engine |
| **Frontend Web App** | `http://localhost:5173` | React 18, Tailwind CSS, html5-qrcode scanner |

### Manual Start Commands (if restarting)
```bash
# Backend
cd server
npm run dev

# Frontend
cd client
npm run dev
```

---

## 👥 Demo Test Accounts & Personas

The database is pre-seeded with test accounts for each role:

| Persona | Role | Email | Password | Pre-Bound Device ID | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Marcus Vance** | `SUPER_ADMIN` | `admin@ironvaultgym.com` | `Admin@12345` | `DEVICE_STAFF_IPAD_DESK_01` | Full financial oversight, threat center & device approvals |
| **Sarah Jenkins** | `MANAGER` | `manager@ironvaultgym.com` | `Manager@12345` | `DEVICE_STAFF_IPAD_DESK_01` | Live WebSocket attendance roll & desk billing |
| **John Doe** | `MEMBER` | `john.doe@example.com` | `Member@12345` | `DEVICE_SAMSUNG_GALAXY_S24` | Active 30-day Pro Pass |
| **Alice Smith** | `MEMBER` | `alice.smith@example.com` | `Member@12345` | `DEVICE_IPHONE_15_PRO` | Expired subscription (Triggers Phase 4 Red Alert) |
| **Bob Wilson** | `MEMBER` | `bob.wilson@example.com` | `Member@12345` | *None* | Tests 1st-time hardware device binding |

*(Note: The login page includes 1-click buttons to instantly switch between these accounts).*

---

## 🧪 How to Test Each Feature

### A. Testing Valid Member Access & Manager Live Feed
1. Open `http://localhost:5173` and click **"John Doe (Active Member)"** to login.
2. Click **"Scan Facility QR for Smart Entry"**.
3. Keep the GPS mode at **"📍 At Gym Entrance"** (within 50m) and click **"Simulate Scanning Entrance QR"**.
4. Result: **"ACCESS GRANTED"** with audio confirmation and a 3-minute Anti-Passback cooldown timer.
5. In another tab or switching to **Manager**, see John Doe appear instantly on the **Live Attendance Feed** via WebSockets!

### B. Testing GPS Geofence Breach (>50m away)
1. As a logged-in member, open the scanner.
2. Toggle GPS to **"🚫 Remote / Outside 50m"** (~550m away).
3. Click **"Simulate Scanning Entrance QR"**.
4. Result: **"ACCESS REJECTED: GPS Geofence Breach"**.
5. Switch to **Super Admin** $\to$ observe the animated **Red Drop-Down Alert Banner** with audible chime, and the incident logged in the **Threat Monitoring Table**.

### C. Testing Multi-Device Login Detection & Admin Approval
1. On the top right navigation bar or login page, change the **Hardware Device ID** to `DEVICE_ROGUE_UNREGISTERED_PHONE`.
2. Attempt to sign in as `john.doe@example.com`.
3. Result: **403 Forbidden - Multi-Device Login Detected!** Account flagged and entry blocked.
4. Log into the **Super Admin** account $\to$ Go to **"Device Approvals"**.
5. You will see John Doe's pending device change ticket. Click **"Approve Device Change"**.
6. John Doe's profile is now bound to the new phone, and he can immediately check in!

### D. Testing Anti-Passback Protection
1. Perform a successful scan as John Doe.
2. Immediately attempt to scan again within 3 minutes.
3. Result: **429 Cooldown Active** with live seconds countdown.

### E. Testing Expired Membership Rejection
1. Sign in as **Alice Smith** (`alice.smith@example.com`).
2. Scan the entrance QR.
3. Result: **403 Expired Membership** $\to$ Red alert banner dropped on Super Admin dashboard and webhook notification dispatched to facility owner.

