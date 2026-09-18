# FITGIT — Product Requirements Document (PRD) & System Architecture Specification

**Product Name:** Fitgit  
**Document Version:** 1.0.0  
**Target Release:** Q4 2026  
**Document Author:** Technical Product Management & Systems Architecture  
**Target Audience:** UI/UX Designers, Frontend/Backend Engineers, DevOps, QA Engineers  

---

## 1. Executive Summary

### 1.1 Product Vision & Purpose
**Fitgit** is an enterprise-grade, cloud-native Gym Customer Relationship Management (CRM) and Facility Access Platform engineered to unify club operations, member lifecycle management, recurring revenue billing, and biometric wellness intelligence into a synchronized ecosystem. 

### 1.2 Core Problems Solved
Independent gyms, multi-location fitness franchises, and boutique studios routinely face operational friction from fragmented toolchains (spreadsheets for roster tracking, standalone payment terminals, paper admission forms, and unintegrated access turnstiles). Fitgit addresses these systemic inefficiencies:

| Problem Domain | Industry Bottleneck | Fitgit Solution |
| :--- | :--- | :--- |
| **Revenue Leakage & Churn** | Expired passes continue accessing the floor; manual payment follow-ups fail. | Automated access cutoff at turnstiles/kiosks, automated **5-day pre-expiry renewal alerts**, and instant digital renewal checkout. |
| **Operational Desk Bottlenecks** | Peak-hour queues caused by manual check-ins and paper KYC registrations. | Sub-second dynamic QR code turnstile check-ins, automated digital KYC workflows, and instant PDF invoice dispatch via WhatsApp/Email. |
| **Member Disengagement** | Members lack visibility into their subscription validity, training splits, and biometrics. | Mobile-first progressive member portal featuring digital wallet access passes, workout logging, and body composition analytics. |
| **Unsynchronized Staff Operations** | Front desk, trainers, and administrators work in data silos. | Unified Role-Based Access Control (RBAC) with granular permissions, client roster assignments, and audit logging. |

---

## 2. User Personas & Access Control Matrix

```
                      +------------------------------------------+
                      |         Fitgit Platform Ecosystem        |
                      +------------------------------------------+
                                           |
         +--------------------+------------+------------+--------------------+
         |                    |                         |                    |
         v                    v                         v                    v
+------------------+ +------------------+     +------------------+ +------------------+
| Admin/Gym Owner  | |  Front Desk/Ops  |     |  Fitness Trainer | |   Gym Member     |
| (Desktop-First)  | |  (Desktop/Tablet)|     |  (Hybrid Mobile) | |  (Mobile-First)  |
+------------------+ +------------------+     +------------------+ +------------------+
```

### 2.1 Persona Specifications

#### A. Admin / Gym Owner (Super Admin & Facility Owner)
* **Goal:** Maximize facility profitability, monitor cash flow, control operating expenses, and audit staff activities.
* **Core Responsibilities:** Master tenant configuration, subscription plan definitions, financial reporting, staff payroll/role provisioning, and facility-wide equipment and hardware oversight.
* **Primary Device:** Desktop (1440px+) / Laptop (1280px).

#### B. Receptionist / Front Desk Staff
* **Goal:** Fast, frictionless member intake, on-the-fly billing, floor entry control, and resolving member inquiries.
* **Core Responsibilities:** Rapid member lookup, cash/POS collection, manual turnstile overrides, issuing guest passes, and scheduling walk-in consultations.
* **Primary Device:** Desktop Terminal / Tablet (iPad / Android POS at 1024px+).

#### C. Personal Trainer / Fitness Coach
* **Goal:** Manage assigned client caseloads, prescribe training/diet regimens, and record physical assessment milestones.
* **Core Responsibilities:** Reviewing member health alerts and injury disclosures, logging session completion, updating body metrics (BMI, body fat %, muscle mass), and tracking member athletic split adherence.
* **Primary Device:** Tablet / Mobile Web (375px – 768px).

#### D. Gym Member
* **Goal:** Frictionless facility access, membership pass management, tracking workout consistency, and viewing dietary targets.
* **Core Responsibilities:** Presenting dynamic digital entry passes at access turnstiles, submitting digital health KYC forms, renewing expiring packages, and booking scheduled classes.
* **Primary Device:** Mobile-First Smartphone (iOS Safari / Android Chrome / PWA at 375px – 430px).

---

### 2.2 Role-Based Permissions Matrix (RBAC)

| System Feature / Module | Super Admin | Gym Owner | Receptionist / Desk | Personal Trainer | Member |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **View Revenue & Financial Analytics** | Full (Global) | Full (Facility) | Restricted (Daily Register Only) | None | None |
| **Create / Modify Membership Plans** | Yes | Yes | Read Only | None | None |
| **Desk Onboarding & Plan Billing** | Yes | Yes | Yes | None | None |
| **Delete / Terminate Member Records** | Yes | Yes | No (Soft Flag Only) | None | None |
| **Override Access Turnstile Gates** | Yes | Yes | Yes | No | None |
| **Assign Trainers to Members** | Yes | Yes | Yes | No | None |
| **View Full Medical / Health Profiles** | Yes | Yes | Basic Alert View | Assigned Clients | Self Only |
| **Update Client Biometrics & Routines** | Yes | Yes | No | Assigned Clients | Self (Restricted) |
| **Present QR Pass & Check-In Logs** | Yes | Yes | Yes | Yes | Self Only |

---

## 3. Core Functional Modules

```
+-----------------------------------------------------------------------------------+
|                            Fitgit Functional Architecture                         |
+-----------------------------------------------------------------------------------+
| [1. Member Management]     | [2. Subscription & Billing] | [3. Access & Attendance]  |
| - Profile & Account Store  | - Plan Catalog Engine       | - Dynamic QR Generator    |
| - Digital Admission KYC    | - Automated PDF Invoicing   | - Turnstile Verification  |
| - Biometric Trackers       | - Pre-Expiry Alert Engine   | - Active Session Monitor  |
| - Health Disclosures       | - Gateway Integrations      | - Offline Gate Fallback   |
+----------------------------+-----------------------------+---------------------------+
| [4. Scheduling & Classes]  | [5. Admin Analytics Hub]    | [6. Security & Comms]     |
| - Interactive Calendar     | - MRR / Cash Accounting     | - Multi-Device WhatsApp   |
| - Capacity Lock Engine     | - Churn / Retention Curves  | - TLS / AES-256 Storage   |
| - Trainer Roster Matrix    | - Peak Hour Utilization     | - RBAC Token Management   |
+-----------------------------------------------------------------------------------+
```

---

### Module 1: Member Lifecycle & Health Intelligence

#### 1.1 Profile Store & State Engine
Every member entity transitions across four strictly enforced system lifecycle states:

```
                  +-----------------------------------+
                  |            PENDING_KYC            |
                  +-----------------------------------+
                                    |
                                    v (KYC Submission & Stamped Invoice)
                  +-----------------------------------+
                  |              ACTIVE               | <---------+
                  +-----------------------------------+           |
                   |                                 |            |
(Expiry Date Reached)                    (Admin Freeze Request)   | (Plan Renewed)
                   v                                 v            |
        +--------------------+             +--------------------+ |
        |      EXPIRED       |             |       FROZEN       | |
        +--------------------+             +--------------------+ |
                   |                                 |            |
                   +---------------------------------+------------+
```

* **Data Fields Captured:** Legal Name, Primary Mobile (WhatsApp normalized to E.164), Secondary Phone, Email, Date of Birth, Gender, Blood Group, Residential Address, Emergency Contact (Name, Relationship, Phone).
* **State Behaviors:**
  * `PENDING_KYC`: Member can sign in to view the onboarding checklist, but QR pass access returns `ACCESS_DENIED_KYC_REQUIRED`.
  * `ACTIVE`: Full floor turnstile pass privileges granted; schedule bookings active.
  * `FROZEN`: Turnstile pass temporarily invalid without expelling billing term; term extends by frozen days upon reactivation.
  * `EXPIRED`: Automated access lockout triggered at all scanner points; UI presents immediate renewal call-to-action.

#### 1.2 Biometric & Health Intelligence Tracker
* **Anthropometric Registry:** Height (cm), Weight (kg), Computed BMI ($\text{kg/m}^2$), Body Fat Percentage (%), Skeletal Muscle Mass (kg), Circumferential measurements (Waist, Chest, Hip, Arm, Thigh).
* **Medical Risk & Advisory Disclosures:** High Blood Pressure, Asthma, Heart Condition, Spinal / Musculoskeletal Injuries, Surgical History, Current Prescription Medications.
* **Trainer Health Sharing Utility:** A one-click dispatch action on the Trainer and Admin dashboards that compiles biometrics, fitness targets, and signed KYC documents into an encrypted PDF report and dispatches it directly to the member's WhatsApp.

---

### Module 2: Subscription Catalog, Billing & Automated Invoicing

#### 2.1 Membership Plan Catalog Engine
* **Plan Hierarchy:**
  * Multi-Tier Schemes (e.g., Bronze, Silver VIP, Elite Annual, Off-Peak).
  * Variable Duration (1 Month, 3 Months, 6 Months, 12 Months, Custom Days).
  * Access Privilege Rules (All-Access 24/7 vs. Off-Peak Hours e.g., 10:00–16:00).
* **Financial Calculations:** Base Rate, Admission / Registration Fee, GST / VAT Surcharge, Discount Coupon Deductions, and Net Billed Amount.

#### 2.2 Automated Invoicing Engine (Official Stamped Bills)
* **Trigger:** Dispatched immediately upon Desk Billing completion or Online Self-Renewal checkout.
* **Output:** Electronically stamped, vector-rendered PDF invoice containing:
  * Unique Invoice Number (Format: `INV-[TENANT_ID]-[TIMESTAMP]`).
  * Member ID and Membership Validity Window (Start Date $\to$ End Date).
  * Complete fee breakdown with tax lines.
  * Facility Authorized Seal and Official Digital Stamp.
* **Distribution:** Dual delivery over authenticated WhatsApp Document payload and transactional Email.

#### 2.3 Pre-Expiry Notification System (5-Day Prior Window)
* **Automated Cron Evaluator:** Executes daily at `00:01` UTC.
* **Target Criteria:** Active subscriptions where $\text{Days Remaining} = 5$ ($T-5$ days).
* **Channel Delivery:** Automated WhatsApp alert dispatched to member:
  > *"⚠️ [GYM NAME] • MEMBERSHIP RENEWAL NOTICE (5 DAYS LEFT). Dear [Member Name], your membership will conclude on [Date]. To maintain uninterrupted access through the entry turnstiles and preserve personal trainer bookings, please renew via the link below or visit the front desk."*

---

### Module 3: Turnstile Access Control & Attendance Engine

#### 3.1 Dynamic Anti-Passback QR Lifecycle
To prevent credential sharing (screenshots forwarded to non-members), Fitgit employs a dynamic cryptographically signed QR token engine:

```
+------------------+         +--------------------+         +-------------------+
|  Member Device   |         | Fitgit Turnstile   |         | Fitgit Central    |
|   (Mobile Web)   |         | Kiosk / Tablet     |         | Backend Engine    |
+------------------+         +--------------------+         +-------------------+
         |                             |                              |
         |-- 1. Request Dynamic QR --->|                              |
         |   (Token Rotates Every 30s) |                              |
         |                             |                              |
         |-- 2. Present QR to Lens --->|                              |
         |                             |-- 3. POST /verify-access --->|
         |                             |   (Token + Device Geo)       |
         |                             |                              |-- 4. Check Validity,
         |                             |                              |      Anti-Passback,
         |                             |                              |      Subscription State
         |                             |<-- 5. Result: ACCESS_GRANTED |
         |<-- 6. Green Ring / Gate Open|      (or ACCESS_DENIED)      |
         |                             |                              |
```

* **Token Payload:** JSON Web Token (JWT) containing `userId`, `facilityId`, `timestamp`, and rotating `nonce` valid for only 30 seconds.
* **Anti-Passback Rule:** If an entry scan is logged, that member cannot scan for entry again until an exit scan is registered (or after a configurable cooldown of 120 minutes).
* **Scan Latency Constraint:** Verification round-trip must resolve in **$\le 250\text{ ms}$** over broadband to avoid entry turnstile queuing.

#### 3.2 Real-Time Floor Attendance Dashboard
* **Live Occupancy Counter:** Displays live headcount against the fire-safety maximum occupancy limit.
* **Session Duration Tracker:** Automatically computes elapsed workout duration from `ENTRY_TIMESTAMP` to `EXIT_TIMESTAMP`.
* **Desk Check-in Override:** Receptionist modal to manually search and admit members who forgot their mobile device, logged with operator audit stamps.

---

### Module 4: Class & Trainer Scheduling

#### 4.1 Interactive Multi-View Calendar
* **View Modes:** Day (Resource-Split), Week (Trainer-Grid), and Month (Overview).
* **Class Configuration:** Title, Instructor / Trainer, Studio Room, Start/End Time, Maximum Capacity, and Cancellation Cutoff Window (e.g., 2 hours prior).

#### 4.2 Waitlist & Overbooking Engine
* When Class Capacity ($C_{\text{max}}$) is reached, subsequent booking requests increment the FIFO (First-In, First-Out) Waitlist Queue.
* If an enrolled member cancels before the cutoff window, the queue shifts automatically: Waitlist Position 1 is booked, and an automated SMS/WhatsApp invitation is dispatched.

---

### Module 5: Admin Analytics & Financial Executive Hub

#### 5.1 Real-Time Executive KPI Dashboard
* **Monthly Recurring Revenue (MRR):** Total active subscription value amortized over monthly intervals.
* **Cash Collected Today / Month-to-Date:** Gross receipts across Cash, Credit Card, UPI, and Bank Transfers.
* **Retention & Churn Velocity:** Percentage of expiring members who renew within 7 days of expiration.
* **Capacity Heatmap:** Visual hourly density breakdown (06:00 to 22:00) highlighting peak floor usage hours.

---

## 4. Critical User Flows (UI/UX Journey Maps)

### 4.1 User Flow A: Adding & Onboarding a New Member (Front Desk)

```
[Start: Member Arrives at Front Desk]
               |
               v
[Desk Opens Fitgit -> "New Registration" Modal]
               |
               v
[Input Step 1: Identity & Contact Details]
- Full Name, Phone (WhatsApp), Email, DOB, Gender
               |
               v
[Input Step 2: Plan Selection & Payment]
- Choose Plan Tier (e.g., 3-Month Gold Pass)
- Select Payment Method (Cash, POS Terminal, UPI QR)
- Confirm Payment & Click "Create & Authorize Pass"
               |
               v
[Automated Background Process]
- Creates Member DB Record with status: PENDING_KYC
- Activates Subscription Validity Term
- Generates Stamped Official PDF Tax Invoice
- Dispatches WhatsApp Welcome Package with Invoice PDF Attached
               |
               v
[Member Receives SMS/WhatsApp with Direct Login Link]
               |
               v
[Member Opens Link on Smartphone]
- Authenticates via Passwordless OTP
- Fills Physical Biometrics & Medical Questionnaire
- Checks Legal Terms & Liability Waiver Checkbox
- Clicks "Submit Official KYC Registration"
               |
               v
[System Upgrades Member Status to ACTIVE]
- Unlocks Dynamic QR Access Pass in Mobile View
- Turnstiles Instantly Permit Floor Entry
[End Flow]
```

#### Screen Checklist for UI/UX Designer:
1. `DeskBillingModal.tsx`: Stepper form with plan picker dropdown, tax summary calculator, and immediate invoice generation button.
2. `FirstTimeMemberEnrollmentModal.tsx`: Mobile-responsive card layout with blood-group pills, numeric measurement inputs, medical disclaimer checkboxes, and high-contrast confirmation CTA.

---

### 4.2 User Flow B: Member Renewing an Expired Subscription (Self-Service)

```
[State: Member Subscription Reaches T-5 Days or T=0 (Expired)]
               |
               v
[System Dispatches Automated WhatsApp Renewal Notice with Deep Link]
               |
               v
[Member Clicks Link -> Lands on Fitgit Mobile Portal]
               |
               v
[Pass Status Displays Red Warning: "MEMBERSHIP EXPIRED"]
- Access Pass Disabled (Turnstile Gate Scan Locked)
- Prominent Volt CTA: "Renew Your Membership"
               |
               v
[Checkout Modal Opens]
- Pre-selected Existing Plan (or Option to Upgrade Tier)
- Displays Applicable Renewal Discounts or Surcharges
- Integrated Gateway Payment Sheet (Stripe / Razorpay / Apple Pay)
               |
               v
[Payment Authenticated Successfully]
               |
               v
[Instant State Synchronization via WebSocket]
- Subscription Extended from Prior End Date (or Today if Lapsed)
- Status Changes to ACTIVE
- Turnstile Access Restored in < 1 Second
- New PDF Receipt Dispatched to WhatsApp
[End Flow]
```

#### Screen Checklist for UI/UX Designer:
1. `MemberDigitalPass.tsx`: State transitions from Gray/Red (Expired) to High-Contrast Emerald/Volt (Active) with timestamp ticker.
2. `RenewalCheckoutSheet.tsx`: Bottom sheet drawer for mobile with one-tap payment options and immediate status refresh.

---

## 5. Technical Architecture & Implementation Guidelines

```
+-------------------------------------------------------------------------------+
|                            System Architecture Stack                          |
+-------------------------------------------------------------------------------+
| FRONTEND PRESENTATION LAYER                                                   |
| - React 18+ / TypeScript SPA                                                  |
| - Styling: Tailwind CSS (FIDGIT Token System)                                 |
| - State Management: React Context API + LocalStorage Caching                  |
| - Real-Time Transport: Socket.io Client Engine                                |
+-------------------------------------------------------------------------------+
                                      |
                           HTTPS REST & WebSockets
                                      |
+-------------------------------------------------------------------------------+
| BACKEND APPLICATION LAYER (Node.js & Express)                                 |
| - Controllers: Auth, Members, Billing, Documents, WhatsApp, Hardware Scanner  |
| - Middleware: JWT Authentication, Role-Based Access Control, Rate Limiter     |
| - Background Workers: Node-Cron Scheduler (Daily 5-Day Expiry Engine)         |
| - Document Service: PDFKit / Puppeteer Vector Invoicing & KYC Generator       |
| - Messaging Engine: WhatsApp Socket Adapter (Baileys / Meta Cloud API)        |
+-------------------------------------------------------------------------------+
                                      |
                      Prisma ORM / Database Connector
                                      |
+-------------------------------------------------------------------------------+
| DATA PERSISTENCE & STORAGE LAYER                                              |
| - Primary RDBMS: SQLite (Local/Dev) / PostgreSQL (Production) via Prisma      |
| - Automated JSON Snapshot & Disaster Recovery Mirror Engine                   |
| - Encrypted Blob Storage for Profile Photos & Signed Document Copies          |
+-------------------------------------------------------------------------------+
```

### 5.1 Design Tokens & UI/UX Directives

#### Layout Paradigms:
* **Admin / Operations Panel:** **Desktop-First (1280px – 1920px).** Information density must prioritize horizontal data tables, visible quick-filter toolbars, multi-column metrics, and rapid keyboard-shortcut support (`Cmd/Ctrl + S` for scanner, `Enter` for search).
* **Member Portal Views:** **Mobile-First (375px – 430px).** Full viewport height optimization (`100dvh`), sticky bottom-thumb navigation bar, zero-lag dynamic QR pass display, and touch-target sizing ($\ge 48\text{ px}$).

#### Color Tokens:
* **Canvas Background (Deep Void):** `bg-[#050507]`
* **Card & Module Surfaces (Surface Dark):** `bg-[#0e1015]`
* **Interactive Elements / Inputs:** `bg-[#121418]`
* **Primary Accent & Brand Energy (Signature Volt):** `#ccff00`
* **Success / Access Granted:** `#10b981` (Emerald 500)
* **Danger / Access Expired:** `#ef4444` (Rose 500)
* **Borders & Dividers:** `border-white/10` or `border-white/5`

#### Typography:
* **Headings, Badges, and Numeric Metrics:** `font-['Unbounded', sans-serif]` (Bold, Uppercase, Tracking-Tight).
* **Body Text, Tables, and Forms:** `font-['Outfit', sans-serif]` (Regular/Medium, High Legibility).

---

## 6. Non-Functional, Security & Compliance Requirements

1. **Sub-Second Access Verification:** Turnstile QR scanning must evaluate user identity, pass status, anti-passback rules, and return a hardware trigger signal in under **250 ms**.
2. **Data Protection & Health Privacy:** Biometric and medical questionnaires must be encrypted at rest (AES-256) and accessible only to assigned personal trainers and administrators.
3. **Database Fault Tolerance & Persistence:** Dual-persistence mechanism combining active database transactions with periodic automated JSON snapshot mirrors to prevent data loss across cloud container restarts.
4. **Offline Resilience:** If cloud connectivity is temporarily interrupted, local desk terminals must cache active member pass keys to permit authorized entry without facility disruption.

