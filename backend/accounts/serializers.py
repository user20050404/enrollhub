# accounts/serializers.py
from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from .models import CustomUser


class RegisterSerializer(serializers.ModelSerializer):
    password  = serializers.CharField(write_only=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True)

    class Meta:
        model  = CustomUser
        fields = ('email', 'first_name', 'last_name', 'role', 'password', 'password2')

    def validate(self, data):
        if data['password'] != data['password2']:
            raise serializers.ValidationError({'password': 'Passwords do not match.'})
        return data

    def create(self, validated_data):
        validated_data.pop('password2')
        user = CustomUser.objects.create_user(**validated_data)
        return user


class UserSerializer(serializers.ModelSerializer):
    profile_image = serializers.SerializerMethodField()

    class Meta:
        model  = CustomUser
        fields = ('id', 'email', 'first_name', 'last_name', 'role',
                  'profile_image', 'is_verified', 'is_active', 'date_joined')
        read_only_fields = ('id', 'is_verified', 'date_joined')

    def get_profile_image(self, obj):
        if not obj.profile_image:
            return None
        # If it's already a full URL (Cloudinary), return as-is
        url = str(obj.profile_image)
        if url.startswith('http'):
            return url
        # Otherwise build absolute URL using request context
        request = self.context.get('request')
        if request:
            return request.build_absolute_uri(obj.profile_image.url)
        return url


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, validators=[validate_password])