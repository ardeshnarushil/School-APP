from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    SchoolClassViewSet, TeacherViewSet, StudentViewSet, 
    HomeworkViewSet, AttendanceViewSet, DashboardStatsView,
    ChangePasswordView, ParentViewSet, NoticeViewSet,
    ExamViewSet, ResultViewSet, ProfileView, NotificationViewSet,
    SeedDatabaseView
)

router = DefaultRouter()
router.register(r'classes', SchoolClassViewSet, basename='classes')
router.register(r'teachers', TeacherViewSet, basename='teachers')
router.register(r'students', StudentViewSet, basename='students')
router.register(r'homework', HomeworkViewSet, basename='homework')
router.register(r'attendance', AttendanceViewSet, basename='attendance')
router.register(r'parents', ParentViewSet, basename='parents')
router.register(r'notices', NoticeViewSet, basename='notices')
router.register(r'exams', ExamViewSet, basename='exams')
router.register(r'results', ResultViewSet, basename='results')
router.register(r'notifications', NotificationViewSet, basename='notifications')

urlpatterns = [
    path('', include(router.urls)),
    path('dashboard-stats/', DashboardStatsView.as_view(), name='dashboard-stats'),
    path('change-password/', ChangePasswordView.as_view(), name='change-password'),
    path('me/', ProfileView.as_view(), name='me'),
    path('seed-db/', SeedDatabaseView.as_view(), name='seed-db'),  # TEMP - delete after use
]
