#sections/models.py
from django.db import models
from subjects.models import Subject


class Section(models.Model):
    code          = models.CharField(max_length=30, unique=True)
    subjects      = models.ManyToManyField(Subject, related_name='sections', blank=True)
    max_capacity  = models.IntegerField(default=40)
    academic_year = models.CharField(max_length=20, default='2025-2026')
    semester      = models.IntegerField(default=1)
    created_at    = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.code

    @property
    def enrolled_count(self):
        return self.enrollments.filter(
            status='enrolled'
        ).values('student').distinct().count()

    @property
    def available_slots(self):
        return self.max_capacity - self.enrolled_count

    @property
    def is_full(self):
        return self.enrolled_count >= self.max_capacity

    @property
    def total_units(self):
        return sum(s.units for s in self.subjects.all())