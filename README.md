📌 Attendance Management System

Full-stack web application for managing attendance using:

🟦 Frontend: Next.js (React + TypeScript)
🟨 Backend: Django + Django REST Framework
🔐 Auth: JWT (SimpleJWT)
🗄️ Database: MySQL / SQLite (dev)
🚀 Project Setup
📁 Project Structure
1cs_project/
│
├── frontend/        # Next.js app
├── backend/         # Django API
└── README.md
🟦 FRONTEND SETUP (Next.js)
1. Install dependencies
cd frontend
npm install
2. Create environment file

Create:

frontend/.env.local
Example:
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
NEXT_PUBLIC_APP_NAME=AttendanceSystem
3. Run frontend
npm run dev

Runs on:

http://localhost:3000
🟨 BACKEND SETUP (Django)
1. Create virtual environment
cd backend
python -m venv venv
venv\Scripts\activate   # Windows
2. Install dependencies
pip install -r requirements.txt
3. Create environment file

Create:

backend/.env
Example:
SECRET_KEY=your_secret_key
DEBUG=True

DB_NAME=attendance_db
DB_USER=root
DB_PASSWORD=1234
DB_HOST=localhost
DB_PORT=3306

EMAIL_HOST_USER=your_email@gmail.com
EMAIL_HOST_PASSWORD=your_app_password
4. Run migrations
python manage.py migrate
5. Create superuser (optional)
python manage.py createsuperuser
6. Run server
python manage.py runserver

Runs on:

http://127.0.0.1:8000
🔐 Authentication (JWT)

We use SimpleJWT.

Login endpoint:
POST /api/token/
Body:
{
  "email": "user@example.com",
  "password": "password"
}
Response:
{
  "access": "token",
  "refresh": "token"
}
Refresh token:
POST /api/token/refresh/
🌐 Frontend API Layer

All requests go through:

api("api/token/", { method: "POST" })

✔ Automatically attaches JWT token
✔ Base URL comes from .env.local

⚠️ IMPORTANT RULES
❌ Never commit:
node_modules/
venv/
.env
.env.local
✅ Always commit:
package.json
package-lock.json
requirements.txt
.gitignore
README.md
👥 Team Workflow
First time setup:
git clone <repo>
cd frontend && npm install
cd backend && pip install -r requirements.txt
Run project:
Terminal 1:
cd backend
python manage.py runserver
Terminal 2:
cd frontend
npm run dev
🧠 Architecture Overview
Frontend (Next.js)
   ↓ HTTP (fetch + JWT)
Backend (Django REST API)
   ↓
Database (MySQL / SQLite)
🔥 Notes for developers
Frontend uses NEXT_PUBLIC_API_URL
Backend uses .env via python-decouple
Authentication is stateless (JWT)
Always run npm install after pulling changes
Always run migrate after backend changes
🛠 Common Issues
❌ "Module not found"

👉 Run:

npm install
❌ "no such table"

👉 Run:

python manage.py migrate
❌ CORS error

👉 Check Django CORS settings

📌 Future improvements
Role-based access (admin / student / teacher)
Attendance dashboard
Email notifications
Refresh token auto handling
👨‍💻 Maintainers

Team project for 1CS - Web Development