# students/models.py
from django.db import models
from accounts.models import CustomUser


class Student(models.Model):
    user       = models.OneToOneField(CustomUser, on_delete=models.CASCADE, related_name='student_profile')
    student_id = models.CharField(max_length=20, unique=True)
    course     = models.CharField(max_length=100)
    year_level = models.IntegerField(default=1)
    max_units  = models.IntegerField(default=24)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f'{self.student_id} - {self.user.get_full_name()}'

    @property
    def total_enrolled_units(self):
        return sum(
            e.subject.units
            for e in self.enrollments.filter(status='enrolled')
            if e.subject is not None
        )