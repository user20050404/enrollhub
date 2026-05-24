#accounts/urls.py
from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    RegisterView, VerifyEmailView, LoginView,
    LogoutView, MeView, ChangePasswordView,
    UpdateProfileView, ActivateAccountView, UserListView,
)

urlpatterns = [
    path('register/',                  RegisterView.as_view(),        name='register'),
    path('login/',                     LoginView.as_view(),           name='login'),
    path('logout/',                    LogoutView.as_view(),          name='logout'),
    path('token/refresh/',             TokenRefreshView.as_view(),    name='token_refresh'),
    path('verify-email/<str:token>/',  VerifyEmailView.as_view(),     name='verify-email'),
    path('me/',                        MeView.as_view(),              name='me'),
    path('me/update/',                 UpdateProfileView.as_view(),   name='update-profile'),
    path('change-password/',           ChangePasswordView.as_view(),  name='change-password'),
    path('users/',                     UserListView.as_view(),        name='user-list'),
    path('users/<int:user_id>/activate/', ActivateAccountView.as_view(), name='activate-account'),
]