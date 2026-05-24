# students/serializers.py
from rest_framework import serializers
from accounts.models import CustomUser
from .models import Student


class StudentSerializer(serializers.ModelSerializer):
    user                 = serializers.SerializerMethodField()
    total_enrolled_units = serializers.ReadOnlyField()
    full_name            = serializers.SerializerMethodField()

    class Meta:
        model  = Student
        fields = ('id', 'user', 'student_id', 'course', 'year_level',
                  'max_units', 'total_enrolled_units', 'full_name',
                  'created_at', 'updated_at')

    def get_user(self, obj):
        from accounts.serializers import UserSerializer
        return UserSerializer(obj.user).data

    def get_full_name(self, obj):
        return obj.user.get_full_name()


class StudentCreateSerializer(serializers.ModelSerializer):
    email      = serializers.EmailField(write_only=True)
    first_name = serializers.CharField(write_only=True)
    last_name  = serializers.CharField(write_only=True)
    password   = serializers.CharField(write_only=True, default='EnrollHub2024!')

    class Meta:
        model  = Student
        fields = ('email', 'first_name', 'last_name', 'password',
                  'student_id', 'course', 'year_level', 'max_units')

    def validate_email(self, value):
        user = CustomUser.objects.filter(email=value).first()
        if user:
            # Block only if they already have a student profile
            if hasattr(user, 'student_profile'):
                raise serializers.ValidationError(
                    'A student with this email already exists.'
                )
        return value

    def validate_student_id(self, value):
        if Student.objects.filter(student_id=value).exists():
            raise serializers.ValidationError('A student with this ID already exists.')
        return value

    def create(self, validated_data):
        email      = validated_data.pop('email')
        first_name = validated_data.pop('first_name')
        last_name  = validated_data.pop('last_name')
        password   = validated_data.pop('password')

        # ✅ Link existing user if they already registered
        user = CustomUser.objects.filter(email=email).first()
        if user:
            user.first_name  = first_name
            user.last_name   = last_name
            user.role        = 'student'
            user.is_verified = True
            user.is_active   = True
            user.save()
        else:
            user = CustomUser.objects.create_user(
                email       = email,
                first_name  = first_name,
                last_name   = last_name,
                password    = password,
                role        = 'student',
                is_verified = True,
                is_active   = True,
            )

        student = Student.objects.create(user=user, **validated_data)
        return student