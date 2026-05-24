from django.core.management.base import BaseCommand
from accounts.models import CustomUser


class Command(BaseCommand):
    help = 'Creates the default superuser for EnrollHub'

    def handle(self, *args, **kwargs):
        email = 'admin@enrollhub.com'

        if CustomUser.objects.filter(email=email).exists():
            self.stdout.write(f'Superuser {email} already exists.')
            return

        user = CustomUser.objects.create_superuser(
            email      = email,
            password   = 'Admin1234!',
            first_name = 'Admin',
            last_name  = 'User',
        )
        user.is_verified = True
        user.is_active   = True
        user.save()

        self.stdout.write(
            self.style.SUCCESS(f'Superuser {email} created successfully!')
        )