# Blue-Green Pricing

A modular backend + frontend project demonstrating **Blue-Green deployment routing** for a pricing page.  
The backend serves **Blue** and **Green** pricing JSON files based on configurable routing rules.

---

## 📂 Project Structure

```
backend/
├─ server.js          # Express server entry point
├─ router.js          # Modular routing logic
├─ config.json        # Routing rules (cookie, header, IP, percentage)
├─ pricing/
│  ├─ blue.json       # Blue pricing version
│  ├─ green.json      # Green pricing version
├─ requests.log       # Logs of requests and routing decisions
├─ package.json       # Backend dependencies

frontend/
├─ src/
│  ├─ App.jsx         # React frontend
│  └─ ...
├─ vite.config.js     # Dev proxy setup
├─ package.json       # Frontend dependencies
```

---

## ⚙️ Setup Instructions

### 1. Backend
```bash
cd backend
npm install
node server.js
```

Backend runs at [http://localhost:3000](http://localhost:3000).

### 2. Frontend (Development mode)
```bash
cd frontend
npm install
npm run dev
```

Frontend runs at [http://localhost:5173](http://localhost:5173).

👉 The Vite proxy forwards `/pricing` requests to the backend.

### 3. Frontend (Production mode)
Build and serve frontend from backend:
```bash
cd frontend
npm run build
cd ../backend
node server.js
```

Now visit [http://localhost:3000](http://localhost:3000).

### 4. Live on Render
Frontend:- https://blue-green-deployment-1.onrender.com/
Backend:- https://blue-green-deployment-jrk7.onrender.com/pricing

Now visit [https://blue-green-deployment-1.onrender.com/](https://blue-green-deployment-1.onrender.com/).
---

## ⚖️ Routing Rules

Configured via `backend/config.json`:

```json
{
  "ruleOrder": ["cookie", "header", "ip", "percentage"],
  "sticky": true,
  "cookieName": "pricing_version",
  "percentage": { "blue": 70, "green": 30 },
  "ip": { "192.168.1.0/24": "green" },
  "header": {
    "X-Version": {
      "blue": "blue",
      "green": "green"
    }
  }
}
```

### Rule Types
- **Cookie-based** → sticky sessions, consistent experience.
- **Header-based** → send `X-Version: blue` or `green` to force version.
- **IP-based** → map IP ranges to specific version.
- **Percentage-based** → weighted random split.

### Sticky Sessions
If `sticky: true`, first request assigns version → stored in `pricing_version` cookie.

---

## 📝 Logging
Every request is logged in `backend/requests.log`, e.g.:

```
[2025-09-29T12:34:56.789Z] {"method":"GET","url":"/pricing","rule":"percentage","client":"127.0.0.1","version":"green"}
```

---

## 🧪 Testing

- Force **Blue**:
  ```bash
  curl -H "X-Version: blue" http://localhost:3000/pricing
  ```

- Force **Green**:
  ```bash
  curl -H "X-Version: green" http://localhost:3000/pricing
  ```

- Clear sticky cookie in browser to re-trigger random routing.

---

