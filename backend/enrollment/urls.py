#enrollment/urls.py
from django.urls import path
from .views import (
    EnrollmentListView, EnrollmentCreateView,
    EnrollmentDetailView, EnrollmentSummaryView,
    StudentSelfEnrollView, MyEnrollmentsView,
)

urlpatterns = [
    path('',             EnrollmentListView.as_view(),    name='enrollment-list'),
    path('create/',      EnrollmentCreateView.as_view(),  name='enrollment-create'),
    path('summary/',     EnrollmentSummaryView.as_view(), name='enrollment-summary'),
    path('me/',          MyEnrollmentsView.as_view(),     name='my-enrollments'),
    path('self-enroll/', StudentSelfEnrollView.as_view(), name='self-enroll'),
    path('<int:pk>/',    EnrollmentDetailView.as_view(),  name='enrollment-detail'),
]