from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from django.core.mail import send_mail  # <--- Importar para emails
from .models import Task, Profile, UserTask
from .serializers import TaskSerializer, UserSerializer, UserUpdateSerializer

# --- UTILIDAD: AUTO-GENERAR DATOS ---
def seed_database():
    if Task.objects.count() == 0:
        defaults = [
            {"title": "Reciclar Botellas Plásticas", "points": 10, "description": "Fácil", "icon_type": "plastic"},
            {"title": "Reciclar Cartón y Papel", "points": 5, "description": "Fácil", "icon_type": "paper"},
            {"title": "Reciclar Vidrio", "points": 15, "description": "Medio", "icon_type": "glass"},
            {"title": "Reciclar Latas de Aluminio", "points": 20, "description": "Medio", "icon_type": "metal"},
            {"title": "Usar Bolsa Reutilizable", "points": 5, "description": "Fácil", "icon_type": "bag"},
        ]
        for t in defaults:
            Task.objects.create(**t)

# --- AUTENTICACIÓN ---

@api_view(['POST'])
def register_user(request):
    data = request.data
    try:
        if User.objects.filter(username=data['email']).exists():
            return Response({'error': 'El correo ya está registrado'}, status=status.HTTP_400_BAD_REQUEST)
        
        user = User.objects.create_user(
            username=data['email'],
            email=data['email'],
            password=data['password'],
            first_name=data.get('name', '')
        )
        Profile.objects.create(user=user, points=0, level="Eco-Iniciado")
        seed_database() # Asegurar tareas
        
        # ENVIAR CORREO DE BIENVENIDA
        try:
            send_mail(
                '¡Bienvenido a EcoPoints!',
                f'Hola {user.first_name}, gracias por unirte a la comunidad que cuida el planeta. ¡Empieza a registrar tus acciones hoy!',
                'noreply@ecopoints.app',
                [user.email],
                fail_silently=True,
            )
        except:
            pass # No detener el registro si falla el correo

        return Response({'success': True, 'message': 'Usuario creado y correo enviado'})
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
def login_user(request):
    data = request.data
    email = data.get('email')
    password = data.get('password')
    user = authenticate(username=email, password=password)
    
    if user is not None:
        return Response({'success': True, 'username': user.username, 'name': user.first_name})
    else:
        return Response({'error': 'Credenciales inválidas'}, status=status.HTTP_401_UNAUTHORIZED)

# --- GESTIÓN DE PERFIL Y CONTRASEÑA ---

@api_view(['GET', 'PUT'])
def user_profile(request):
    email = request.GET.get('email') or request.data.get('username')
    try:
        user = User.objects.get(username=email)
    except User.DoesNotExist:
        return Response({'error': 'Usuario no encontrado'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        serializer = UserSerializer(user)
        return Response(serializer.data)
    
    elif request.method == 'PUT':
        # Actualizar Datos Básicos
        serializer = UserUpdateSerializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            
            # Actualizar Contraseña si viene en el request
            new_password = request.data.get('new_password')
            if new_password and len(new_password) > 0:
                user.set_password(new_password)
                user.save()

            return Response({'success': True, 'message': 'Perfil y contraseña actualizados', 'data': serializer.data})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
def recover_password(request):
    email = request.data.get('email')
    try:
        user = User.objects.get(email=email)
        # Simulamos envío de código o nueva contraseña
        temp_code = "123456" 
        
        send_mail(
            'Recuperación de Contraseña - EcoPoints',
            f'Hola, tu código de recuperación temporal es: {temp_code}. Por favor ingresa a tu perfil y cambia tu contraseña.',
            'noreply@ecopoints.app',
            [email],
            fail_silently=False,
        )
        return Response({'success': True, 'message': f'Correo enviado a {email}'})
    except User.DoesNotExist:
        # Por seguridad, no decimos si el correo no existe, pero aquí para dev:
        return Response({'error': 'Correo no encontrado'}, status=status.HTTP_404_NOT_FOUND)

# --- DATOS ---

@api_view(['GET'])
def get_dashboard_data(request):
    email = request.GET.get('username')
    if not email:
        return Response({"points": 0, "co2": 0, "level": "Invitado", "progress": 0, "weekly_data": []})
    try:
        user = User.objects.get(username=email)
        profile = user.profile
        
        data = {
            "points": profile.points,
            "co2": round(profile.co2_saved, 2),
            "level": profile.level,
            "progress": min(100, int((profile.points % 1000) / 10)),
            "weekly_data": [
                {"name": "Lun", "points": 10, "co2": 2},
                {"name": "Mar", "points": 25, "co2": 5},
                {"name": "Mie", "points": 15, "co2": 3},
                {"name": "Jue", "points": 40, "co2": 8},
            ]
        }
        return Response(data)
    except:
         return Response({"points": 0, "co2": 0, "level": "Error", "progress": 0, "weekly_data": []})

@api_view(['GET'])
def get_tasks(request):
    # Si no hay tareas, las crea. Si ya hay tareas (creadas en Admin), devuelve esas.
    seed_database()
    tasks = Task.objects.all()
    serializer = TaskSerializer(tasks, many=True)
    return Response(serializer.data)

@api_view(['GET'])
def get_ranking(request):
    profiles = Profile.objects.select_related('user').order_by('-points')[:10]
    ranking_data = []
    for p in profiles:
        ranking_data.append({
            "id": p.user.id,
            "name": p.user.first_name or p.user.username.split('@')[0],
            "points": p.points
        })
    return Response(ranking_data)

@api_view(['POST'])
def create_custom_task(request):
    email = request.data.get('username')
    # code = request.data.get('code') # No lo usamos para lógica, solo registro
    quantity = int(request.data.get('quantity', 1))
    material_type = request.data.get('material_type')

    try:
        user = User.objects.get(username=email)
        profile = user.profile
        
        points_map = {'plastic': 10, 'glass': 15, 'paper': 5, 'metal': 20}
        points_unit = points_map.get(material_type, 5)
        total_points = points_unit * quantity

        task_name = f"Reciclaje: {material_type}"
        task_obj, _ = Task.objects.get_or_create(title=task_name, defaults={'points': points_unit, 'description': 'Escaneo', 'icon_type': 'recycle'})
        
        UserTask.objects.create(user=user, task=task_obj)

        profile.points += total_points
        profile.co2_saved += (quantity * 0.15)
        if profile.points > 500: profile.level = "Eco-Guardián"
        if profile.points > 1500: profile.level = "Eco-Maestro"
        profile.save()

        return Response({'success': True, 'message': f'+{total_points} EcoPoints agregados', 'new_points': profile.points})

    except User.DoesNotExist:
        return Response({'error': 'Usuario no encontrado'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)