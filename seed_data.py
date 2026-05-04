import os
import django
from django.utils import timezone
from datetime import timedelta

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'schoolsync_backend.settings')
django.setup()

from core.models import CustomUser, SchoolClass, Student, Homework, Attendance, Exam, ExamSubject, Result

def seed():
    # 1. Create Admin
    admin, _ = CustomUser.objects.get_or_create(
        username='admin',
        defaults={'role': 'ADMIN', 'is_staff': True, 'is_superuser': True}
    )
    admin.set_password('admin123')
    admin.save()
    print("Admin created: admin / admin123")

    # 2. Create Teacher
    teacher, _ = CustomUser.objects.get_or_create(
        username='teacher_hani',
        defaults={'role': 'TEACHER', 'first_name': 'Hani', 'last_name': 'Smith'}
    )
    teacher.set_password('teacher123')
    teacher.save()
    print("Teacher created: teacher_hani / teacher123")

    # 3. Create Parent
    parent, _ = CustomUser.objects.get_or_create(
        username='parent_doe',
        defaults={'role': 'PARENT', 'first_name': 'John', 'last_name': 'Doe'}
    )
    parent.set_password('parent123')
    parent.save()
    print("Parent created: parent_doe / parent123")

    # 4. Create Class
    school_class, _ = SchoolClass.objects.get_or_create(
        name='Class 1A',
        defaults={'teacher': teacher}
    )
    print("Class created: Class 1A (Assigned to Hani)")

    # 5. Create Student
    student, _ = Student.objects.get_or_create(
        roll_number='S101',
        defaults={
            'name': 'Jane Doe',
            'school_class': school_class,
            'parent': parent
        }
    )
    print("Student created: Jane Doe (Parent: John Doe)")

    # 6. Create Homework
    Homework.objects.get_or_create(
        title='Math Assignment: Fractions',
        defaults={
            'description': 'Please complete exercises 1 to 10 on page 45 of your textbook.',
            'due_date': timezone.now().date() + timedelta(days=3),
            'school_class': school_class
        }
    )
    print("Homework created for Class 1A")

    # 7. Create Attendance
    Attendance.objects.get_or_create(
        student=student,
        date=timezone.now().date(),
        defaults={'status': 'PRESENT'}
    )
    print("Attendance marked for Jane Doe")

    # 8. Create Exam & Results
    exam, _ = Exam.objects.get_or_create(
        name='Mid-Term Examination',
    )
    
    math_sub, _ = ExamSubject.objects.get_or_create(
        exam=exam,
        subject_name='Mathematics',
        defaults={
            'max_marks': 100,
            'exam_date': timezone.now().date() + timedelta(days=7),
            'start_time': '09:00:00',
            'end_time': '12:00:00'
        }
    )

    Result.objects.get_or_create(
        student=student,
        exam_subject=math_sub,
        defaults={'obtained_marks': 85}
    )
    print("Exam and Results created")

if __name__ == '__main__':
    seed()
