from rest_framework import serializers
from .models import CustomUser, SchoolClass, Student, Homework, Attendance, Notice, Exam, Result, ExamSubject, Notification

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ['id', 'username', 'email', 'role', 'first_name', 'last_name', 'password']
        extra_kwargs = {
            'password': {'write_only': True, 'required': False}
        }

    def create(self, validated_data):
        user = CustomUser.objects.create_user(**validated_data)
        return user

class PasswordChangeSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True)
    confirm_password = serializers.CharField(required=True)

    def validate(self, data):
        if data['new_password'] != data['confirm_password']:
            raise serializers.ValidationError("New passwords do not match.")
        return data

class SchoolClassSerializer(serializers.ModelSerializer):
    teacher_name = serializers.CharField(source='teacher.get_full_name', read_only=True)
    class Meta:
        model = SchoolClass
        fields = ['id', 'name', 'teacher', 'teacher_name']

class StudentSerializer(serializers.ModelSerializer):
    class_name = serializers.CharField(source='school_class.name', read_only=True)
    class Meta:
        model = Student
        fields = ['id', 'name', 'roll_number', 'school_class', 'class_name', 'parent', 'profile_picture']
        extra_kwargs = {'school_class': {'required': False}}

class NoticeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notice
        fields = '__all__'

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = '__all__'

class HomeworkSerializer(serializers.ModelSerializer):
    class_name = serializers.CharField(source='school_class.name', read_only=True)
    class Meta:
        model = Homework
        fields = ['id', 'title', 'description', 'due_date', 'created_at', 'school_class', 'class_name']

class AttendanceSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.name', read_only=True)
    class Meta:
        model = Attendance
        fields = ['id', 'student', 'student_name', 'date', 'status']

class ExamSubjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExamSubject
        fields = ['id', 'subject_name', 'max_marks', 'exam_date', 'start_time', 'end_time']

class ExamSerializer(serializers.ModelSerializer):
    subjects = ExamSubjectSerializer(many=True, read_only=True)
    class Meta:
        model = Exam
        fields = ['id', 'name', 'is_visible', 'created_at', 'subjects']

class ResultSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.name', read_only=True)
    subject_name = serializers.CharField(source='exam_subject.subject_name', read_only=True)
    max_marks = serializers.IntegerField(source='exam_subject.max_marks', read_only=True)
    exam_id = serializers.UUIDField(source='exam_subject.exam.id', read_only=True)
    
    class Meta:
        model = Result
        fields = ['id', 'student', 'student_name', 'exam_subject', 'subject_name', 'max_marks', 'obtained_marks', 'exam_id']
