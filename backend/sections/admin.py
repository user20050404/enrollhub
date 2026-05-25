from django.contrib import admin
from .models import Section

@admin.register(Section)
class SectionAdmin(admin.ModelAdmin):
    list_display  = ('code', 'academic_year', 'semester', 'max_capacity', 'enrolled_count', 'available_slots', 'is_full')
    filter_horizontal = ('subjects',)
    search_fields = ('code',)