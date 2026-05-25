from django.contrib import admin
from .models import Student

@admin.register(Student)
class StudentAdmin(admin.ModelAdmin):
    list_display  = ('student_id', 'get_full_name', 'course', 'year_level')
    search_fields = ('student_id', 'user__first_name', 'user__last_name')

    def get_full_name(self, obj):
        return obj.user.get_full_name()
    get_full_name.short_description = 'Full Name'