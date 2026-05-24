from django.urls import path
from .views import SectionListCreateView, SectionDetailView

urlpatterns = [
    path('',          SectionListCreateView.as_view(), name='section-list'),
    path('<int:pk>/', SectionDetailView.as_view(),     name='section-detail'),
]