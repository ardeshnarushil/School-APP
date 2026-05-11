# SchoolSync Implementation Plan

SchoolSync is a comprehensive School Management SaaS with Role-Based Access Control (RBAC) for Admins, Teachers, and Parents.

## 🚀 Getting Started

### 1. Database Setup (PostgreSQL)
Ensure you have PostgreSQL installed and running locally.
- Create a database named `schoolsync`.
- The current configuration uses:
  - **User**: `postgres`
  - **Password**: `password`
  - **Host**: `localhost`
  - **Port**: `5432`

> [!NOTE]
> You can change these credentials in `schoolsync_backend/settings.py`.

### 2. Backend Initialization
Open a terminal in the project root `stitch_schoolsync`:

```powershell
# Activate virtual environment
.\venv\Scripts\activate

# Initialize database schema
python manage.py makemigrations core
python manage.py migrate

# Create Admin User
python manage.py createsuperuser
```

### 3. Running the Application

#### Backend
```powershell
python manage.py runserver
```
The API will be available at `http://localhost:8000`.

#### Frontend
Open a new terminal:
```powershell
cd schoolsync_frontend
npm run dev
```
The UI will be available at `http://localhost:5173`.

## 🏗️ Architecture & Features

### Backend (Django + DRF)
- **CustomUser Model**: Handles roles (ADMIN, TEACHER, PARENT).
- **RBAC**: Custom permissions ensure Teachers only see their classes, Parents only see their children, etc.
- **JWT Auth**: Secure token-based authentication with role-based payloads.

### Frontend (React + Tailwind + Lucide)
- **Institutional Design**: Clean, academic-focused UI with Institutional Blue (#00236f).
- **Teacher Dashboard**:
  - View class-specific student list.
  - Post homework to the class.
  - Mark daily attendance with a toggle list.
- **Parent Dashboard**:
  - Child profile view.
  - Timeline-style feed of homework and attendance updates.
- **Admin Dashboard**:
  - System-wide statistics.
  - Create classes and assign teachers.

## 📂 Project Structure
- `schoolsync_backend/`: Django project root.
- `core/`: Main backend application logic.
- `schoolsync_frontend/`: Vite + React application.
  - `src/pages/`: Role-specific dashboards.
  - `src/components/`: Reusable UI components.
