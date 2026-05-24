from django.urls import path
from .views import SubjectListCreateView, SubjectDetailView

urlpatterns = [
    path('',          SubjectListCreateView.as_view(), name='subject-list'),
    path('<int:pk>/', SubjectDetailView.as_view(),     name='subject-detail'),
]