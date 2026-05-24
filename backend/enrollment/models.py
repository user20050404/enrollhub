#enrollment/models.py
from django.db import models
from students.models import Student
from sections.models import Section
from subjects.models import Subject
from accounts.models import CustomUser


class Enrollment(models.Model):
    STATUS_CHOICES = [
        ('pending',  'Pending'),
        ('enrolled', 'Enrolled'),
        ('dropped',  'Dropped'),
        ('blocked',  'Blocked'),
    ]

    student     = models.ForeignKey(Student,  on_delete=models.CASCADE, related_name='enrollments')
    section     = models.ForeignKey(Section,  on_delete=models.CASCADE, related_name='enrollments')
    subject     = models.ForeignKey(Subject,  on_delete=models.CASCADE, related_name='enrollments', null=True)
    status      = models.CharField(max_length=20, choices=STATUS_CHOICES, default='enrolled')
    enrolled_by = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True, blank=True)
    enrolled_at = models.DateTimeField(auto_now_add=True)
    updated_at  = models.DateTimeField(auto_now=True)
    remarks     = models.TextField(blank=True)

    class Meta:
        # A student can't enroll in the same subject twice
        unique_together = ('student', 'subject')

    def __str__(self):
        return f'{self.student.student_id} → {self.section.code} / {self.subject.code} ({self.status})'