# MEDTRACK — Smart Ambulance & Hospital Emergency Coordination Platform

> **"Connecting Ambulances. Empowering Hospitals. Saving Time."**

[![Live Demo](https://img.shields.io/badge/Live_Website-Online-0D9488?style=for-the-badge&logo=google-chrome&logoColor=white)](https://yashnpatil2007-cloud.github.io/MEDTRACK/)
[![GitHub Repo](https://img.shields.io/badge/GitHub-Repository-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/yashnpatil2007-cloud/MEDTRACK)
[![Deploy on Render](https://img.shields.io/badge/Deploy_to-Render-46E3B7?style=for-the-badge&logo=render&logoColor=white)](https://render.com/deploy?repo=https://github.com/yashnpatil2007-cloud/MEDTRACK)
[![Deploy on Netlify](https://img.shields.io/badge/Deploy_to-Netlify-00C7B7?style=for-the-badge&logo=netlify&logoColor=white)](https://app.netlify.com/start)

---

## 🌐 Live Website Links (Share With Friends & Evaluators)

| Platform | Link | Description |
| :--- | :--- | :--- |
| 🚀 **Live Production Website** | **[https://yashnpatil2007-cloud.github.io/MEDTRACK/](https://yashnpatil2007-cloud.github.io/MEDTRACK/)** | **Immediate full-featured access.** Works on mobile, tablet & desktop. Includes interactive cloud simulation fallback for all 4 roles! |
| 💻 **GitHub Repository** | **[https://github.com/yashnpatil2007-cloud/MEDTRACK](https://github.com/yashnpatil2007-cloud/MEDTRACK)** | Full source code with automated test suite, Docker Compose, and OpenAPI specification. |
| ⚡ **Netlify Project** | **[https://medtrack-emergency.netlify.app](https://medtrack-emergency.netlify.app)** | Configured with `netlify.toml` and SPA `/* /index.html 200` rules. |
| 🛡️ **Render Cloud Service** | **[Deploy with Render Blueprint](https://render.com/deploy?repo=https://github.com/yashnpatil2007-cloud/MEDTRACK)** | Automatically provisions the Python Flask backend with PostgreSQL/SQLite via `render.yaml`. |

---

### 🔑 Instant Demonstration Credentials (1-Click on Login Screen)

| Role | User ID | Password | Capabilities |
| :--- | :--- | :--- | :--- |
| 🚑 **Ambulance Driver** | `AMB-101` | `Ambulance@123` | Real GPS coordinates, request creation, Leaflet radar tracking |
| 🏥 **Hospital Coordinator** | `HOSP-METRO` | `Hospital@123` | Incoming request queue, bed counter, accept/reject triage |
| 🛡️ **Platform Administrator**| `admin1` | `Admin@MedTrack2026` | Hospital approvals, ambulance fleet, user management, audit logs |
| 👑 **Super Administrator** | `superadmin` | `SuperAdmin@MedTrack2026` | System telemetry, database health, admin provisioning |

---

MEDTRACK is a mission-critical, enterprise healthcare coordination SaaS application designed to connect mobile ambulance paramedic crews, hospital emergency triage departments, and municipal emergency management organizations in real-time.

---

## 1. Executive Project Overview

In traditional emergency medical services, ambulances rely on manual phone calls to locate receiving facilities, leading to diversion, unexpected emergency room saturation, and transit delays. 

**MEDTRACK** replaces fragmented phone chains with an authoritative digital coordination engine:
- **Ambulance Paramedics** assess patient emergency levels, acquire device GPS coordinates, view verified regional hospital bed availability in real-time, and transmit instant triage requests.
- **Hospital Emergency Departments** receive incoming audio-visual WebSocket alerts, evaluate trauma bay capacity, accept or reject requests with audit reasons, and track approaching ambulances live on Leaflet radar maps.
- **Administrators** verify and approve hospital credentials before facilities can participate, monitor fleet telemetry, manage user access, and inspect audit logs.
- **Super Administrators** govern platform-wide configuration, platform health telemetry, and administrator provisioning.

---

## 2. Technology Stack

### Frontend
- **Framework**: React 19 with TypeScript
- **Bundler & Tooling**: Vite with Hot Module Replacement
- **Styling**: Tailwind CSS with custom medical theme tokens (Deep Navy, Healthcare Teal, Cyan Accents, Emergency Red)
- **Maps & Cartography**: Leaflet.js with OpenStreetMap tiles
- **Routing Engine**: OSRM (Open Source Routing Machine) integration with fallback waypoints
- **Icons**: Lucide Icons
- **Real-time Client**: Socket.IO Client with automatic reconnection and fallback polling

### Backend
- **Framework**: Python 3.12+ Flask with Application Factory pattern
- **ORM & Database**: SQLAlchemy with declarative models (PostgreSQL in production, SQLite in local development)
- **Real-Time Core**: Flask-SocketIO with threading/WebSocket transport
- **Authentication**: JWT (JSON Web Tokens) HS256 with role-based access enforcement
- **Password Security**: PBKDF2 SHA-256 with 600,000 hashing rounds
- **Input Validation**: Strict server-side coordinate bounds, bed mathematical constraints, and immutable identity guards
- **Testing**: Pytest with automated end-to-end and role-authorization test suites

---

## 3. Project Directory Structure

```text
MEDTRACK/
├── backend/
│   ├── app/
│   │   ├── __init__.py           # Flask application factory, error handlers, blueprints
│   │   ├── config.py             # Development, Testing, Production configurations
│   │   ├── extensions.py         # SQLAlchemy and SocketIO singletons
│   │   ├── models/               # Relational database models
│   │   │   ├── user.py           # Users & immutable role models
│   │   │   ├── ambulance.py      # Ambulance crew profiles & telemetry
│   │   │   ├── hospital.py       # Hospitals, verification status & bed models
│   │   │   ├── emergency_request.py # Triage requests & state machine
│   │   │   ├── journey.py        # Active transit records & geometries
│   │   │   ├── location_update.py # Time-series GPS updates
│   │   │   ├── route_change.py   # Rerouting logs
│   │   │   ├── notification.py   # Persistent in-app notifications
│   │   │   ├── audit.py          # Forensic administrative audit trails
│   │   │   ├── contact.py        # Public inquiries
│   │   │   └── system_setting.py # Runtime system configuration
│   │   ├── routes/               # Blueprint API controllers
│   │   │   ├── auth.py           # Registration & login
│   │   │   ├── requests.py       # Emergency request lifecycle & decisions
│   │   │   ├── hospitals.py      # Bed availability & hospital registry
│   │   │   ├── journeys.py       # Journey start/end & GPS telemetry streaming
│   │   │   ├── ambulances.py     # Fleet inspection
│   │   │   ├── admin.py          # Verifications, metrics, user management
│   │   │   ├── superadmin.py     # Platform health & admin provisioning
│   │   │   ├── notifications.py  # User notifications
│   │   │   ├── contact.py        # Landing page contact submissions
│   │   │   └── routing_proxy.py  # OSRM road route calculator
│   │   ├── services/
│   │   │   ├── socket_service.py # WebSocket room dispatchers
│   │   │   ├── routing_service.py# OSRM routing and fallback waypoint generator
│   │   │   └── audit_service.py  # Audit logging helper
│   │   └── utils/
│   │       ├── auth_helpers.py   # JWT decorators & role gatekeepers
│   │       └── validators.py     # Coordinate & bed constraint validators
│   ├── tests/                    # Automated Pytest suite (17 passed)
│   ├── seed.py                   # Development database seeder
│   ├── run.py                    # Server startup script
│   ├── openapi.json              # OpenAPI 3.0 REST specification
│   ├── Dockerfile                # Production Python container
│   └── requirements.txt          # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── components/           # Navbar, Sidebar, LeafletMap, Toast, Modal, StatCard
│   │   ├── context/              # AuthContext & NotificationContext
│   │   ├── pages/
│   │   │   ├── LandingPage.tsx   # Premium SaaS public homepage
│   │   │   ├── AuthPages/        # AmbulanceRegister, HospitalRegister, Login
│   │   │   ├── Ambulance/        # Dashboard, NewRequest, LiveTracking, History, Settings
│   │   │   ├── Hospital/         # Dashboard, IncomingRequests, BedAvailability, Radar, History, Settings
│   │   │   ├── Admin/            # Dashboard, HospitalVerification, Fleet, Users, Analytics, AuditLogs
│   │   │   └── SuperAdmin/       # PlatformHealth, SystemSettings, AdminProvisioning
│   │   ├── services/             # Typed API client & WebSocket connector
│   │   ├── types/                # Complete TypeScript domain interfaces
│   │   ├── App.tsx               # Primary application router & layout orchestrator
│   │   └── main.tsx              # React DOM entrypoint
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── Dockerfile                # Multi-stage production Nginx container
│   └── nginx.conf                # Reverse proxy configuration
├── docker-compose.yml            # Multi-container production deployment
├── .env.example                  # Environment variable reference template
├── pytest.ini                    # Pytest discovery configuration
└── README.md                     # Architectural documentation
```

---

## 4. Quick Start (Local Development)

### Prerequisites
- Python 3.12+ (or `uv`)
- Node.js 18+ and npm

### Step 1: Initialize Backend & Database
```bash
# Navigate to backend
cd backend

# Create virtual environment and install dependencies
# Using standard venv or uv:
uv venv .venv
uv pip install -r requirements.txt

# Seed demonstration database with hospitals, ambulances, and admin accounts:
uv run python seed.py

# Start the Flask-SocketIO backend server (Runs on http://localhost:5000):
uv run python run.py
```

### Step 2: Initialize Frontend
```bash
# In a separate terminal, navigate to frontend
cd frontend

# Install dependencies (already installed in workspace)
npm install

# Start Vite development server (Runs on http://localhost:3000):
npm run dev
```

Open your browser at `http://localhost:3000` to access the full MEDTRACK platform.

---

## 5. Seeded Demonstration Accounts

The database includes realistic demonstration accounts for every role:

| Role | User ID | Password | Description / Capabilities |
| :--- | :--- | :--- | :--- |
| **Super Administrator** | `superadmin` | `SuperAdmin@MedTrack2026` | Master configuration, platform health, admin provisioning |
| **Platform Administrator** | `admin1` | `Admin@MedTrack2026` | Hospital approvals, fleet oversight, user governance, audit trail |
| **Hospital 1 (Approved)** | `HOSP-METRO` | `Hospital@123` | Metro Trauma & Tertiary Care (60 Beds, live queue) |
| **Hospital 2 (Approved)** | `HOSP-CITYGEN` | `Hospital@123` | City General Hospital & Emergency Unit (45 Beds) |
| **Hospital 3 (Approved)** | `HOSP-STJUDE` | `Hospital@123` | St. Jude Acute Care & Cardiac Center (50 Beds) |
| **Hospital (Pending)** | `HOSP-NEW` | `Hospital@123` | Green Valley Regional Hospital (Demonstrates Admin verification flow) |
| **Ambulance Unit 1** | `AMB-101` | `Ambulance@123` | Paramedic Marcus Vance (Device GPS, Live Tracking) |
| **Ambulance Unit 2** | `AMB-102` | `Ambulance@123` | Paramedic Elena Rostova (Dispatched status) |
| **Ambulance Unit 3** | `AMB-103` | `Ambulance@123` | Paramedic David Kim (Completed transfers) |

> **Pro Tip**: The Sign In screen (`/login`) includes **1-Click Quick Fill** buttons for all four roles so you can test transitions seamlessly without manual typing.

---

## 6. Testing & Quality Assurance

MEDTRACK includes a comprehensive automated test suite testing:
- Ambulance 5-field registration & ID immutability
- Hospital 3-field registration & pending verification status
- Bed availability server calculation ($Available = Total - Occupied$) and rejection of invalid constraints ($Total < 0$, $Occupied > Total$)
- Cross-hospital request tampering prevention
- GPS coordinate bounds validation ($-90 \le lat \le 90$, $-180 \le lng \le 180$)
- Journey lifecycle state machine ($Pending \to Accepted \to Active \to Completed$)
- Role authorization barriers and Super Administrator protection

To run the automated tests:
```bash
uv run pytest -v
```

**Results**: All **17 test cases pass** with zero failures.

---

## 7. Production Deployment (Docker Compose)

MEDTRACK is fully containerized with production-ready Dockerfiles for both frontend (multi-stage Node + Nginx) and backend (Python slim + PostgreSQL driver).

To launch the full production cluster:
```bash
docker-compose up --build -d
```

The stack provisions:
1. `medtrack_postgres`: PostgreSQL 16 database with persistent volume
2. `medtrack_backend`: Flask-SocketIO application on port 5000
3. `medtrack_frontend`: Nginx serving optimized static React bundle with reverse proxy on port 80 / 3000

### HTTPS & Browser Geolocation Notice
In accordance with W3C web standards, modern web browsers restrict `navigator.geolocation` to **Secure Contexts (HTTPS)** or `localhost`. When deploying to a public domain, provision an SSL/TLS certificate (e.g. via Let's Encrypt / Certbot) on Nginx so that mobile ambulance devices can acquire satellite GPS coordinates.

---

## 8. External Service Disclosures & Transparency

- **Mapping & Road Network**: Map tiles and road geometry are sourced from **OpenStreetMap** contributors via the **OSRM (Open Source Routing Machine)** public engine.
- **Traffic Disclosures**: OpenStreetMap does not natively collect private probe telemetry or cellular speed data. If proprietary traffic feeds (e.g., TomTom / HERE / Google) are unconfigured, MEDTRACK utilizes priority siren road clearance calculations and explicitly labels advisory notifications as **SIMULATED TRAFFIC ADVISORY**.
- **GPS Coordinates**: Real device coordinates are acquired only when authorized by ambulance crew. When indoor testing or satellite signal loss occurs, manual location coordinates are clearly demarcated from satellite fixes.
