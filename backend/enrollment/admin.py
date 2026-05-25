from django.contrib import admin
from .models import Enrollment

@admin.register(Enrollment)
class EnrollmentAdmin(admin.ModelAdmin):
    list_display  = ('student', 'section', 'subject', 'status', 'enrolled_at')
    list_filter   = ('status',)
    search_fields = ('student__student_id', 'section__code', 'subject__code')