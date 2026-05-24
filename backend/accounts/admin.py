from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser

class CustomUserAdmin(UserAdmin):
    model = CustomUser
    list_display  = ('email', 'first_name', 'last_name', 'role', 'is_verified', 'is_active')
    ordering      = ('email',)
    search_fields = ('email', 'first_name', 'last_name')

    fieldsets = (
        (None,           {'fields': ('email', 'password')}),
        ('Personal info',{'fields': ('first_name', 'last_name', 'profile_image')}),
        ('Permissions',  {'fields': ('role', 'is_verified', 'is_active', 'is_staff', 'is_superuser')}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields' : ('email', 'first_name', 'last_name', 'role', 'password1', 'password2'),
        }),
    )

admin.site.register(CustomUser, CustomUserAdmin)