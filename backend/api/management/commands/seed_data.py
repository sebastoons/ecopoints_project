from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from api.models import Profile, Task
import random

class Command(BaseCommand):
    help = 'Carga datos iniciales (Usuarios ficticios y Tareas)'

    def handle(self, *args, **kwargs):
        self.stdout.write("Iniciando carga de datos...")

        # 1. Crear Tareas Predeterminadas (Administrador)
        tasks_data = [
            {"title": "Reciclar 2 botellas de plástico", "points": 50, "description": "Fácil", "icon_type": "recycle"},
            {"title": "Juntar 3 cajas de cartón", "points": 30, "description": "Fácil", "icon_type": "box"},
            {"title": "Llevar ropa a punto limpio", "points": 100, "description": "Medio", "icon_type": "shirt"},
            {"title": "Usar bolsas reutilizables", "points": 20, "description": "Diario", "icon_type": "bag"},
            {"title": "Reciclar latas de aluminio", "points": 60, "description": "Fácil", "icon_type": "can"},
        ]

        for t in tasks_data:
            Task.objects.get_or_create(title=t['title'], defaults=t)
        
        self.stdout.write(self.style.SUCCESS(f"Se aseguraron {len(tasks_data)} tareas base."))

        # 2. Crear Usuarios Ficticios para Ranking
        fake_users = [
            {"name": "Juan Pérez", "email": "juan@fake.com", "points": 1500, "level": "Eco-Maestro"},
            {"name": "María González", "email": "maria@fake.com", "points": 1250, "level": "Eco-Experto"},
            {"name": "Carlos Ruiz", "email": "carlos@fake.com", "points": 980, "level": "Eco-Guerrero"},
            {"name": "Ana López", "email": "ana@fake.com", "points": 850, "level": "Eco-Guerrero"},
            {"name": "Luisa Fernández", "email": "luisa@fake.com", "points": 450, "level": "Eco-Iniciado"},
        ]

        for u in fake_users:
            if not User.objects.filter(username=u['email']).exists():
                user = User.objects.create_user(
                    username=u['email'],
                    email=u['email'],
                    password="password123",
                    first_name=u['name']
                )
                # Crear o actualizar perfil
                Profile.objects.filter(user=user).update(
                    points=u['points'],
                    level=u['level'],
                    co2_saved=u['points'] * 0.2
                )
        
        self.stdout.write(self.style.SUCCESS(f"Se crearon {len(fake_users)} usuarios ficticios."))