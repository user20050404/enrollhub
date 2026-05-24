#subjects/models.py
from django.db import models


class Subject(models.Model):
    TYPE_CHOICES = [
        ('lecture', 'Lecture'),
        ('lab',     'Laboratory'),
        ('lec_lab', 'Lecture + Lab'),
    ]

    code         = models.CharField(max_length=20, unique=True)
    name         = models.CharField(max_length=200)
    units        = models.IntegerField()
    instructor   = models.CharField(max_length=100, blank=True, default='')
    schedule     = models.CharField(max_length=100, blank=True, default='')
    room         = models.CharField(max_length=50,  blank=True, default='')
    description  = models.TextField(blank=True)
    department   = models.CharField(max_length=100)
    subject_type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='lecture')
    created_at   = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'{self.code} - {self.name}'