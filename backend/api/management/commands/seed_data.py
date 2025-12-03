from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from api.models import Profile, Task
import os

class Command(BaseCommand):
    help = 'Carga datos iniciales y Superusuario'

    def handle(self, *args, **kwargs):
        self.stdout.write("Iniciando carga de datos...")

        # --- 1. CREAR SUPERUSUARIO AUTOMÁTICO (NUBE) ---
        # Usa variables de entorno si existen, sino usa valores por defecto
        ADMIN_EMAIL = os.environ.get('DJANGO_SUPERUSER_EMAIL', 'admin@ecopoints.cl')
        ADMIN_PASS = os.environ.get('DJANGO_SUPERUSER_PASSWORD', 'Eco123456')
        
        if not User.objects.filter(email=ADMIN_EMAIL).exists():
            # Crear superusuario usando el email como username para evitar conflictos
            User.objects.create_superuser(
                username=ADMIN_EMAIL, 
                email=ADMIN_EMAIL,
                password=ADMIN_PASS,
                first_name="Admin"
            )
            # Crear perfil para el admin para evitar errores en el frontend
            admin_user = User.objects.get(email=ADMIN_EMAIL)
            if not Profile.objects.filter(user=admin_user).exists():
                Profile.objects.create(user=admin_user, points=0, level="Administrador")

            self.stdout.write(self.style.SUCCESS(f"✅ Superusuario {ADMIN_EMAIL} creado."))
        else:
            self.stdout.write(f"ℹ️ El usuario {ADMIN_EMAIL} ya existe.")

        # --- 2. TAREAS ---
        tasks_data = [
            {"title": "Reciclar 2 botellas de plástico", "points": 50, "description": "Fácil", "icon_type": "plastic"},
            {"title": "Juntar 3 cajas de cartón", "points": 30, "description": "Fácil", "icon_type": "box"},
            {"title": "Llevar ropa a punto limpio", "points": 100, "description": "Medio", "icon_type": "shirt"},
            {"title": "Usar bolsas reutilizables", "points": 20, "description": "Diario", "icon_type": "bag"},
            {"title": "Reciclar latas de aluminio", "points": 60, "description": "Fácil", "icon_type": "can"},
        ]

        for t in tasks_data:
            Task.objects.get_or_create(title=t['title'], defaults=t)
        
        self.stdout.write(self.style.SUCCESS(f"✅ Se aseguraron {len(tasks_data)} tareas base."))