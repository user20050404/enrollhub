from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from .models import Subject
from .serializers import SubjectSerializer


class SubjectListCreateView(generics.ListCreateAPIView):
    queryset           = Subject.objects.all().order_by('code')
    serializer_class   = SubjectSerializer
    permission_classes = [IsAuthenticated]


class SubjectDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset           = Subject.objects.all()
    serializer_class   = SubjectSerializer
    permission_classes = [IsAuthenticated]