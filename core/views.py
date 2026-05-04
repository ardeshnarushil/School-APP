from django.utils import timezone
from rest_framework import viewsets, permissions, status, views, serializers
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from .models import CustomUser, SchoolClass, Student, Homework, Attendance, Notice, Exam, Result, ExamSubject, Notification
from .serializers import (
    UserSerializer, SchoolClassSerializer, StudentSerializer, 
    HomeworkSerializer, AttendanceSerializer, PasswordChangeSerializer, NoticeSerializer,
    ExamSerializer, ResultSerializer, NotificationSerializer
)
from .permissions import IsAdmin, IsTeacher, IsParent

class ProfileView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

class ChangePasswordView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = PasswordChangeSerializer(data=request.data)
        if serializer.is_valid():
            user = request.user
            if not user.check_password(serializer.data.get("old_password")):
                return Response({"old_password": ["Wrong password."]}, status=status.HTTP_400_BAD_REQUEST)
            user.set_password(serializer.data.get("new_password"))
            user.save()
            return Response({"status": "Password updated successfully"}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class CustomTokenObtainPairView(TokenObtainPairView):
    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        if response.status_code == 200:
            user = CustomUser.objects.get(username=request.data['username'])
            response.data['role'] = user.role
            response.data['username'] = user.username
        return response

class SchoolClassViewSet(viewsets.ModelViewSet):
    queryset = SchoolClass.objects.all()
    serializer_class = SchoolClassSerializer
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.IsAuthenticated()]
        return [IsAdmin()]

class TeacherViewSet(viewsets.ModelViewSet):
    queryset = CustomUser.objects.filter(role='TEACHER')
    serializer_class = UserSerializer
    permission_classes = [IsAdmin]

    def perform_create(self, serializer):
        password = self.request.data.get('password')
        user = serializer.save(role='TEACHER')
        if password:
            user.set_password(password)
            user.save()

    def perform_update(self, serializer):
        password = self.request.data.get('password')
        user = serializer.save()
        if password:
            user.set_password(password)
            user.save()

class StudentViewSet(viewsets.ModelViewSet):
    serializer_class = StudentSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role == 'ADMIN':
            return Student.objects.all()
        elif user.role == 'TEACHER':
            return Student.objects.filter(school_class__teacher=user)
        elif user.role == 'PARENT':
            return Student.objects.filter(parent=user)
        return Student.objects.none()

    def perform_create(self, serializer):
        if self.request.user.role == 'TEACHER':
            # Teachers can only create students for their assigned class
            assigned_class = SchoolClass.objects.filter(teacher=self.request.user).first()
            if assigned_class:
                serializer.save(school_class=assigned_class)
            else:
                serializer.save()
        else:
            serializer.save()

class ParentViewSet(viewsets.ModelViewSet):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'ADMIN':
            return CustomUser.objects.filter(role='PARENT')
        elif user.role == 'TEACHER':
            return CustomUser.objects.filter(role='PARENT', children__school_class__teacher=user).distinct()
        return CustomUser.objects.none()

    def perform_create(self, serializer):
        password = self.request.data.get('password')
        user = serializer.save(role='PARENT')
        if password:
            user.set_password(password)
            user.save()

    def perform_update(self, serializer):
        password = self.request.data.get('password')
        user = serializer.save()
        if password:
            user.set_password(password)
            user.save()

class HomeworkViewSet(viewsets.ModelViewSet):
    serializer_class = HomeworkSerializer

    def get_queryset(self):
        user = self.request.user
        date = self.request.query_params.get('date')
        
        if user.role == 'ADMIN':
            qs = Homework.objects.all()
        elif user.role == 'TEACHER':
            qs = Homework.objects.filter(school_class__teacher=user)
        elif user.role == 'PARENT':
            student_classes = Student.objects.filter(parent=user).values_list('school_class', flat=True)
            qs = Homework.objects.filter(school_class__in=student_classes)
        else:
            qs = Homework.objects.none()

        if date:
            qs = qs.filter(created_at__date=date)
        return qs.order_by('-created_at')

    def perform_create(self, serializer):
        if self.request.user.role == 'TEACHER':
            # Optionally ensure they are posting to their own class
            serializer.save()
        else:
            serializer.save()

class AttendanceViewSet(viewsets.ModelViewSet):
    serializer_class = AttendanceSerializer

    def get_queryset(self):
        user = self.request.user
        date = self.request.query_params.get('date')
        queryset = Attendance.objects.none()

        if user.role == 'ADMIN':
            queryset = Attendance.objects.all()
        elif user.role == 'TEACHER':
            queryset = Attendance.objects.filter(student__school_class__teacher=user)
        elif user.role == 'PARENT':
            queryset = Attendance.objects.filter(student__parent=user)
        
        if date:
            queryset = queryset.filter(date=date)
        return queryset

    def create(self, request, *args, **kwargs):
        student_id = request.data.get('student')
        date = request.data.get('date')
        attendance_status = request.data.get('status')
        
        attendance, created = Attendance.objects.update_or_create(
            student_id=student_id,
            date=date,
            defaults={'status': attendance_status}
        )
        
        serializer = self.get_serializer(attendance)
        return Response(serializer.data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)

class NoticeViewSet(viewsets.ModelViewSet):
    queryset = Notice.objects.all().order_by('-created_at')
    serializer_class = NoticeSerializer

    def perform_create(self, serializer):
        # The 'Latest' Rule: Deactivate all old notices when a new one is posted
        Notice.objects.all().update(active=False)
        serializer.save(active=True)

    def get_queryset(self):
        if self.request.user.role in ['TEACHER', 'PARENT']:
            return Notice.objects.filter(active=True).order_by('-created_at')
        return Notice.objects.all().order_by('-created_at')

class ExamViewSet(viewsets.ModelViewSet):
    queryset = Exam.objects.all().order_by('-created_at')
    serializer_class = ExamSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'ADMIN':
            return Exam.objects.all().order_by('-created_at')
        elif user.role == 'TEACHER':
            return Exam.objects.filter(school_class__teacher=user).order_by('-created_at')
        elif user.role == 'PARENT':
            # Parents see ALL exams for their children's classes (for Timetable)
            student_classes = Student.objects.filter(parent=user).values_list('school_class', flat=True)
            return Exam.objects.filter(school_class__in=student_classes).distinct().order_by('-created_at')
        return Exam.objects.none()

    def create(self, request, *args, **kwargs):
        subjects_data = request.data.get('subjects', [])
        
        # Determine school_class
        school_class_id = request.data.get('school_class')
        if not school_class_id and request.user.role == 'TEACHER':
            assigned_class = SchoolClass.objects.filter(teacher=request.user).first()
            if assigned_class:
                school_class_id = assigned_class.id

        exam = Exam.objects.create(
            name=request.data.get('name'),
            school_class_id=school_class_id
        )
        for sub in subjects_data:
            ExamSubject.objects.create(
                exam=exam,
                subject_name=sub.get('name'),
                max_marks=sub.get('max_marks', 100),
                exam_date=sub.get('exam_date') or None,
                start_time=sub.get('start_time') or None,
                end_time=sub.get('end_time') or None
            )
        # Trigger A: Automatic Notification for new Exam Timetable
        Notification.objects.create(
            title="New Exam Timetable Added",
            message=f"A new exam timetable has been added: {exam.name}. Check the Timetable section for details.",
            user_type='PARENT'
        )

        serializer = self.get_serializer(exam)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        exam = self.get_object()
        exam.name = request.data.get('name', exam.name)
        
        # Only update is_visible if it's in the request
        if 'is_visible' in request.data:
            old_visibility = exam.is_visible
            new_visibility = request.data.get('is_visible')
            exam.is_visible = new_visibility
            
            # Trigger B: Automatic Notification for Results Visibility
            if new_visibility and not old_visibility:
                Notification.objects.create(
                    title="Exam Results Published",
                    message=f"Results for {exam.name} have been published. You can now view them in the Results menu.",
                    user_type='PARENT'
                )
            
        exam.save()
        
        # ONLY update subjects if the 'subjects' key is explicitly provided
        if 'subjects' in request.data:
            subjects_data = request.data.get('subjects', [])
            incoming_ids = [s.get('id') for s in subjects_data if s.get('id')]
            
            # Delete subjects not in the update list
            exam.subjects.exclude(id__in=incoming_ids).delete()
            
            for sub_data in subjects_data:
                sub_id = sub_data.get('id')
                target_name = sub_data.get('name') or sub_data.get('subject_name')
                
                if sub_id:
                    ExamSubject.objects.filter(id=sub_id, exam=exam).update(
                        subject_name=target_name,
                        max_marks=sub_data.get('max_marks', 100),
                        exam_date=sub_data.get('exam_date') or None,
                        start_time=sub_data.get('start_time') or None,
                        end_time=sub_data.get('end_time') or None
                    )
                else:
                    ExamSubject.objects.create(
                        exam=exam,
                        subject_name=target_name,
                        max_marks=sub_data.get('max_marks', 100),
                        exam_date=sub_data.get('exam_date') or None,
                        start_time=sub_data.get('start_time') or None,
                        end_time=sub_data.get('end_time') or None
                    )
        
            # Trigger A: Automatic Notification for Timetable Update
            Notification.objects.create(
                title="Exam Timetable Updated",
                message=f"The exam timetable for {exam.name} has been updated. Please check for schedule changes.",
                user_type='PARENT'
            )
        
        serializer = self.get_serializer(exam)
        return Response(serializer.data)

class ResultViewSet(viewsets.ModelViewSet):
    queryset = Result.objects.all()
    serializer_class = ResultSerializer
    permission_classes = [permissions.IsAuthenticated]

    def create(self, request, *args, **kwargs):
        student_id = request.data.get('student')
        exam_subject_id = request.data.get('exam_subject')
        obtained_marks = request.data.get('obtained_marks')

        # Security check: Teachers can only mark their own students
        if request.user.role == 'TEACHER':
            student = Student.objects.filter(id=student_id, school_class__teacher=request.user).first()
            if not student:
                return Response({"error": "Unauthorized: This student is not in your class."}, status=status.HTTP_403_FORBIDDEN)
        
        result, created = Result.objects.update_or_create(
            student_id=student_id,
            exam_subject_id=exam_subject_id,
            defaults={'obtained_marks': obtained_marks}
        )
        
        serializer = self.get_serializer(result)
        return Response(serializer.data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)

    def get_queryset(self):
        user = self.request.user
        exam_id = self.request.query_params.get('exam')
        qs = Result.objects.all()
        
        if user.role == 'PARENT':
            # Parents only see results for exams where is_visible=True
            qs = qs.filter(student__parent=user, exam_subject__exam__is_visible=True)
        elif user.role == 'TEACHER':
            qs = qs.filter(student__school_class__teacher=user)
            
        if exam_id:
            qs = qs.filter(exam_subject__exam_id=exam_id)
            
        return qs

class NotificationViewSet(viewsets.ModelViewSet):
    queryset = Notification.objects.all().order_by('-created_at')
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'PARENT':
            return Notification.objects.filter(user_type__in=['PARENT', 'ALL']).order_by('-created_at')
        return Notification.objects.all().order_by('-created_at')

class DashboardStatsView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        data = {}
        if user.role == 'ADMIN':
            data = {
                'total_classes': SchoolClass.objects.count(),
                'total_teachers': CustomUser.objects.filter(role='TEACHER').count(),
                'total_students': Student.objects.count(),
                'user_distribution': [
                    {'name': 'Teachers', 'value': CustomUser.objects.filter(role='TEACHER').count()},
                    {'name': 'Parents', 'value': CustomUser.objects.filter(role='PARENT').count()},
                    {'name': 'Admins', 'value': CustomUser.objects.filter(role='ADMIN').count()},
                ]
            }
        elif user.role == 'TEACHER':
            assigned_class = SchoolClass.objects.filter(teacher=user).first()
            data = {
                'class_name': assigned_class.name if assigned_class else "None",
                'class_id': assigned_class.id if assigned_class else None,
                'total_students': Student.objects.filter(school_class__teacher=user).count(),
                'recent_homework': HomeworkSerializer(Homework.objects.filter(school_class__teacher=user).order_by('-created_at')[:5], many=True, context={'request': request}).data,
                'students': StudentSerializer(Student.objects.filter(school_class__teacher=user), many=True, context={'request': request}).data
            }
        elif user.role == 'PARENT':
            from datetime import date, timedelta
            children = Student.objects.filter(parent=user)
            # Attendance Trends (last 7 days)
            trends = []
            for i in range(6, -1, -1):
                d = date.today() - timedelta(days=i)
                present = Attendance.objects.filter(student__parent=user, date=d, status='PRESENT').count()
                absent = Attendance.objects.filter(student__parent=user, date=d, status='ABSENT').count()
                trends.append({
                    'day': d.strftime('%a'),
                    'present': present,
                    'absent': absent
                })

            # Weekly Attendance Stats [Present, Absent]
            last_7_days = date.today() - timedelta(days=7)
            weekly_present = Attendance.objects.filter(student__parent=user, date__gte=last_7_days, status='PRESENT').count()
            weekly_absent = Attendance.objects.filter(student__parent=user, date__gte=last_7_days, status='ABSENT').count()

            # Filter exams for their children's classes
            student_classes = children.values_list('school_class', flat=True)
            relevant_exams = Exam.objects.filter(school_class__in=student_classes).distinct().order_by('-created_at')

            data = {
                'children': StudentSerializer(children, many=True, context={'request': request}).data,
                'weekly_stats': [weekly_present, weekly_absent],
                'attendance_trends': trends,
                'recent_attendance': AttendanceSerializer(Attendance.objects.filter(student__parent=user).order_by('-date')[:10], many=True, context={'request': request}).data,
                'exams': ExamSerializer(relevant_exams, many=True).data
            }
        
        # Add latest notice to all
        latest_notice = Notice.objects.filter(active=True).order_by('-created_at').first()
        data['announcement'] = latest_notice.content if latest_notice else None
        
        return Response(data)
