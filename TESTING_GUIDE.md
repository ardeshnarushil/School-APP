# SchoolSync Testing Guide

Follow these steps to initialize the system and test the role-based dashboards.

## 1. Prepare the Database
Make sure you have created the database `school_db` in your PostgreSQL instance.

## 2. Run Migrations & Seed Data
Open a terminal in `stitch_schoolsync` and run:

```powershell
# Activate environment
.\venv\Scripts\activate

# Generate and apply migrations
python manage.py makemigrations core
python manage.py migrate

# Seed the database with test accounts
python manage.py shell -c "import seed_data; seed_data.seed()"
```

## 3. Start Servers

### Start Backend
In terminal 1:
```powershell
python manage.py runserver
```

### Start Frontend
In terminal 2:
```powershell
cd schoolsync_frontend
npm run dev
```

## 4. Test User Accounts

Use these credentials to test the different role-based views at `http://localhost:5173`:

| Role | Username | Password | Features to Test |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin` | `admin123` | View stats, Create Classes, Assign Teachers |
| **Teacher** | `teacher_hani` | `teacher123` | View Students, Post Homework, Mark Attendance |
| **Parent** | `parent_doe` | `parent123` | View Child Profile, Timeline of updates |

## 5. Testing Flow
1. **Login as Admin**: Check the overview. Go to "Manage Classes" and create a new class (e.g., "2B") and assign a teacher.
2. **Login as Teacher**: See the students in your class. Go to "Post Homework" and fill out the form. Go to "Daily Attendance" and toggle some statuses.
3. **Login as Parent**: Verify you see "Jane Doe" as your child. Check the "School Updates" feed to see the homework posted by the teacher. Check "Attendance" to see the history.
