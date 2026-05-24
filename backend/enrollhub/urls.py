#enrollhub/urls.py
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/',            admin.site.urls),
    path('api/auth/',         include('accounts.urls')),
    path('api/students/',     include('students.urls')),
    path('api/subjects/',     include('subjects.urls')),
    path('api/sections/',     include('sections.urls')),
    path('api/enrollments/',  include('enrollment.urls')),
    path('api/chatbot/',      include('chatbot.urls')),
]

urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)