# accounts/views.py
import secrets
import uuid
from django.core.mail import send_mail
from django.conf import settings
from rest_framework import status, generics
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework_simplejwt.tokens import RefreshToken

from .models import CustomUser, EmailVerificationToken
from .serializers import RegisterSerializer, UserSerializer, ChangePasswordSerializer


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()

            # Auto-create Student profile if role is student
            if user.role == 'student':
                from students.models import Student
                Student.objects.get_or_create(
                    user=user,
                    defaults={
                        'student_id': f'STU-{uuid.uuid4().hex[:8].upper()}',
                        'course':     'Not set',
                        'year_level': 1,
                        'max_units':  24,
                    }
                )

            # Create verification token
            token_value = secrets.token_urlsafe(32)
            EmailVerificationToken.objects.create(user=user, token=token_value)

            # Build verify URL using DOMAIN from settings
            domain     = settings.DOMAIN
            verify_url = f"http://{domain}/api/auth/verify-email/{token_value}/"

            # Send real email via Brevo
            send_mail(
                subject       = 'Verify your EnrollHub account',
                message       = (
                    f'Hi {user.first_name},\n\n'
                    f'Welcome to EnrollHub!\n\n'
                    f'Click the link below to verify your account:\n\n'
                    f'{verify_url}\n\n'
                    f'This link expires after one use.\n\n'
                    f'If you did not create this account, ignore this email.\n\n'
                    f'— The EnrollHub Team'
                ),
                from_email    = settings.DEFAULT_FROM_EMAIL,
                recipient_list = [user.email],
                fail_silently  = False,
            )

            return Response({
                'message': 'Registration successful. Check your email to verify your account.',
                'user':    UserSerializer(user, context={'request': request}).data
            }, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class VerifyEmailView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, token):
        try:
            token_obj = EmailVerificationToken.objects.get(token=token)
            user      = token_obj.user
            user.is_verified = True
            user.save()
            token_obj.delete()
            return Response({'message': 'Email verified successfully. You can now log in.'})
        except EmailVerificationToken.DoesNotExist:
            return Response({'error': 'Invalid or expired token.'}, status=status.HTTP_400_BAD_REQUEST)


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email    = request.data.get('email', '').strip().lower()
        password = request.data.get('password', '')

        if not email or not password:
            return Response(
                {'error': 'Email and password are required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            user = CustomUser.objects.get(email=email)
        except CustomUser.DoesNotExist:
            return Response({'error': 'Invalid credentials.'}, status=status.HTTP_401_UNAUTHORIZED)

        if not user.check_password(password):
            return Response({'error': 'Invalid credentials.'}, status=status.HTTP_401_UNAUTHORIZED)

        if not user.is_verified:
            return Response(
                {'error': 'Please verify your email before logging in.'},
                status=status.HTTP_403_FORBIDDEN
            )

        if not user.is_active:
            return Response(
                {'error': 'Your account is not yet activated. Please contact the administrator.'},
                status=status.HTTP_403_FORBIDDEN
            )

        refresh = RefreshToken.for_user(user)
        return Response({
            'access':  str(refresh.access_token),
            'refresh': str(refresh),
            'user':    UserSerializer(user, context={'request': request}).data,
        })


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            if not refresh_token:
                return Response(
                    {'error': 'Refresh token is required.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response({'message': 'Logged out successfully.'}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class MeView(generics.RetrieveUpdateAPIView):
    serializer_class   = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user

    def get_serializer_context(self):
        return {'request': self.request}


class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        if serializer.is_valid():
            user = request.user
            if not user.check_password(serializer.validated_data['old_password']):
                return Response(
                    {'error': 'Old password is incorrect.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            user.set_password(serializer.validated_data['new_password'])
            user.save()
            return Response({'message': 'Password changed successfully.'})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UpdateProfileView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes     = [MultiPartParser, FormParser, JSONParser]

    def patch(self, request):
        user = request.user
        data = request.data

        if 'first_name' in data:
            user.first_name = data['first_name']
        if 'last_name' in data:
            user.last_name = data['last_name']

        if 'profile_image' in request.FILES:
            user.profile_image = request.FILES['profile_image']

        user.save()
        return Response(UserSerializer(user, context={'request': request}).data)


class ActivateAccountView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, user_id):
        if request.user.role not in ['admin', 'staff']:
            return Response({'error': 'Not authorized.'}, status=status.HTTP_403_FORBIDDEN)
        try:
            user           = CustomUser.objects.get(id=user_id)
            user.is_active = True
            user.save()
            return Response({'message': f'{user.get_full_name()} account activated successfully.'})
        except CustomUser.DoesNotExist:
            return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)


class UserListView(generics.ListAPIView):
    serializer_class   = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if self.request.user.role not in ['admin', 'staff']:
            return CustomUser.objects.none()
        return CustomUser.objects.all().order_by('-date_joined')