#sections/views.py
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from .models import Section
from .serializers import SectionSerializer


class SectionListCreateView(generics.ListCreateAPIView):
    serializer_class   = SectionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Section.objects.prefetch_related('subjects').all().order_by('code')


class SectionDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class   = SectionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Section.objects.prefetch_related('subjects').all()