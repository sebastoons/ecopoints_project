from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from django.core.mail import send_mail
from rest_framework_simplejwt.tokens import RefreshToken
from django.db.models import Sum, Count
from django.db.models.functions import ExtractWeekDay

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
        seed_database() # Asegurar tareas base
        
        try:
            send_mail(
                '¡Bienvenido a EcoPoints!',
                f'Hola {user.first_name}, gracias por unirte.',
                'noreply@ecopoints.app',
                [user.email],
                fail_silently=True,
            )
        except:
            pass 

        return Response({'success': True, 'message': 'Usuario creado'})
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
def login_user(request):
    data = request.data
    email = data.get('email')
    password = data.get('password')
    
    user = authenticate(username=email, password=password)
    
    if user is not None:
        # Generar Token JWT
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'success': True,
            'username': user.username,
            'name': user.first_name,
            'is_staff': user.is_staff,  # Para saber si es Admin
            'access': str(refresh.access_token),
            'refresh': str(refresh),
        })
    else:
        return Response({'error': 'Credenciales inválidas'}, status=status.HTTP_401_UNAUTHORIZED)

# --- ZONA ADMINISTRADOR (NUEVA) ---

@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated, IsAdminUser])  # Solo Admins
def admin_manage_users(request):
    if request.method == 'GET':
        users = User.objects.all().select_related('profile')
        data = []
        for u in users:
            # Evitar error si el admin no tiene perfil creado aún
            try:
                level = u.profile.level
            except:
                level = "Admin/Sin Perfil"

            data.append({
                "id": u.id,
                "name": u.first_name,
                "email": u.email,
                "is_active": u.is_active,
                "level": level,
                "last_login": u.last_login
            })
        return Response(data)

    elif request.method == 'PUT':
        # Activar/Desactivar usuarios
        user_id = request.data.get('user_id')
        action = request.data.get('action') 
        
        try:
            user = User.objects.get(id=user_id)
            if action == 'toggle_active':
                # No permitir que un admin se desactive a sí mismo
                if user == request.user:
                    return Response({'error': 'No puedes desactivar tu propia cuenta'}, status=400)
                
                user.is_active = not user.is_active
                user.save()
                estado = "activado" if user.is_active else "suspendido"
                return Response({'success': True, 'message': f'Usuario {estado}.'})
        except User.DoesNotExist:
            return Response({'error': 'Usuario no encontrado'}, status=404)

@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdminUser])
def admin_create_task(request):
    serializer = TaskSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response({'success': True, 'message': 'Tarea creada exitosamente'}, status=201)
    return Response(serializer.errors, status=400)

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminUser])
def admin_dashboard_stats(request):
    # 1. Totales Globales
    total_points = Profile.objects.aggregate(Sum('points'))['points__sum'] or 0
    total_co2 = Profile.objects.aggregate(Sum('co2_saved'))['co2_saved__sum'] or 0
    
    # 2. Gráfico: Tareas por día de la semana
    # Django ExtractWeekDay: 1=Domingo, 2=Lunes, ..., 7=Sábado (Depende de la BD, ajustaremos en frontend)
    activity = UserTask.objects.annotate(weekday=ExtractWeekDay('completed_at'))\
                               .values('weekday')\
                               .annotate(count=Count('id'))\
                               .order_by('weekday')
    
    # Formatear para Recharts
    days_map = {1: 'Dom', 2: 'Lun', 3: 'Mar', 4: 'Mié', 5: 'Jue', 6: 'Vie', 7: 'Sáb'}
    chart_data = [{"day": days_map[item['weekday']], "tasks": item['count']} for item in activity]

    return Response({
        "total_points": total_points,
        "total_co2": round(total_co2, 2),
        "chart_data": chart_data
    })

@api_view(['PUT', 'DELETE'])
@permission_classes([IsAuthenticated, IsAdminUser])
def admin_task_detail(request, task_id):
    try:
        task = Task.objects.get(id=task_id)
    except Task.DoesNotExist:
        return Response({'error': 'Tarea no encontrada'}, status=404)

    if request.method == 'PUT':
        serializer = TaskSerializer(task, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({'success': True, 'message': 'Tarea actualizada'})
        return Response(serializer.errors, status=400)

    elif request.method == 'DELETE':
        task.delete()
        return Response({'success': True, 'message': 'Tarea eliminada correctamente'})

# --- PERFIL Y OTROS ---

@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated])  # Protegemos el perfil
def user_profile(request):
    # Usamos request.user gracias al token
    user = request.user 

    if request.method == 'GET':
        serializer = UserSerializer(user)
        return Response(serializer.data)
    
    elif request.method == 'PUT':
        serializer = UserUpdateSerializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            new_pass = request.data.get('new_password')
            if new_pass:
                user.set_password(new_pass)
                user.save()
            return Response({'success': True, 'message': 'Perfil actualizado'})
        return Response(serializer.errors, status=400)

@api_view(['POST'])
def recover_password(request):
    email = request.data.get('email')
    # Lógica simulada de recuperación
    return Response({'success': True, 'message': f'Si el correo existe, enviamos instrucciones a {email}'})

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_dashboard_data(request):
    user = request.user
    try:
        profile = user.profile
        data = {
            "points": profile.points,
            "co2": round(profile.co2_saved, 2),
            "level": profile.level,
            "progress": min(100, int((profile.points % 1000) / 10)),
            "weekly_data": [
                {"name": "Lun", "points": 10, "co2": 2},
                {"name": "Mar", "points": 25, "co2": 5},
            ]
        }
        return Response(data)
    except:
         return Response({"points": 0, "co2": 0, "level": "Error"}, status=400)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_tasks(request):
    seed_database()
    tasks = Task.objects.all()
    serializer = TaskSerializer(tasks, many=True)
    return Response(serializer.data)

@api_view(['GET'])
def get_ranking(request):
    profiles = Profile.objects.select_related('user').order_by('-points')[:10]
    data = []
    for p in profiles:
        data.append({
            "name": p.user.first_name,
            "points": p.points
        })
    return Response(data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_custom_task(request):
    user = request.user
    material_type = request.data.get('material_type')
    quantity = int(request.data.get('quantity', 1))

    try:
        profile = user.profile
        points_map = {'plastic': 10, 'glass': 15, 'paper': 5, 'metal': 20}
        points = points_map.get(material_type, 5) * quantity
        
        task_name = f"Reciclaje: {material_type}"
        # Buscamos o creamos la tarea para tener referencia
        task_obj, _ = Task.objects.get_or_create(title=task_name, defaults={'points': points, 'icon_type': 'recycle'})
        
        UserTask.objects.create(user=user, task=task_obj)
        
        profile.points += points
        profile.co2_saved += (quantity * 0.15)
        profile.save()
        
        return Response({'success': True, 'message': f'+{points} puntos agregados'})
    except Exception as e:
        return Response({'error': str(e)}, status=400)