# 🚑 Smart Emergency Medical Response System
### Frontend — React 18 + Vite + Tailwind CSS

## 🚀 How to Run

### Prerequisites
- Node.js 18+
- npm or yarn

### Step 1 — Install dependencies
```bash
cd smart-emergency-frontend
npm install
```

### Step 2 — Run development server
```bash
npm run dev
```
App runs at: **http://localhost:5173**

### Step 3 — Build for production
```bash
npm run build
```

---

## 🗂️ Project Structure

```
src/
├── api/          # Axios API modules (auth, hospital, emergency, admin)
├── context/      # AuthContext + WebSocketContext
├── components/
│   └── common/   # Layout, UI components (shared)
├── pages/
│   ├── auth/     # Login, Register
│   ├── patient/  # Dashboard, FindHospitals, EmergencyRequest, RequestHistory
│   ├── hospital/ # Dashboard, BedMgmt, AmbulanceMgmt, EmergencyMgmt, Setup
│   └── admin/    # Dashboard, ManageHospitals, ManageUsers, AllRequests
└── routes/       # PrivateRoute, RoleRoute
```

## 🔑 Demo Login
Visit http://localhost:5173/login — demo credentials are shown on the login page.
