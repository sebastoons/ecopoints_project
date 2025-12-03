from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser, AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from django.core.mail import send_mail
from rest_framework_simplejwt.tokens import RefreshToken
from django.db.models import Sum, Count
from django.db.models.functions import ExtractWeekDay
from django.db import transaction
import secrets
import string

from .models import Task, Profile, UserTask
from .serializers import TaskSerializer, UserSerializer, UserUpdateSerializer

# --- AUTENTICACIÓN Y REGISTRO ---

@api_view(['POST'])
@permission_classes([AllowAny]) 
@authentication_classes([]) # <--- CRUCIAL: Ignora el token dañado y deja entrar
def register_user(request):
    data = request.data
    try:
        # Usamos atomic para asegurar integridad en PostgreSQL
        with transaction.atomic():
            email_clean = data['email'].lower().strip()
            
            if User.objects.filter(email__iexact=email_clean).exists():
                return Response({'error': 'El correo ya está registrado'}, status=status.HTTP_400_BAD_REQUEST)
            
            user = User.objects.create_user(
                username=email_clean, 
                email=email_clean,
                password=data['password'],
                first_name=data.get('name', '').strip()
            )
            
            # Crear perfil asociado
            Profile.objects.create(user=user, points=0, level="Eco-Iniciado")
            
            # Poblar tareas si está vacío (opcional)
            if Task.objects.count() == 0:
                defaults = [
                    {"title": "Reciclar Botellas", "points": 10, "description": "Fácil", "icon_type": "plastic"},
                    {"title": "Usar Bolsa Reutilizable", "points": 5, "description": "Fácil", "icon_type": "bag"},
                ]
                for t in defaults:
                    Task.objects.create(**t)

            # Intento de correo (no bloqueante)
            try:
                send_mail(
                    '¡Bienvenido a EcoPoints!',
                    f'Hola {user.first_name}, gracias por unirte a EcoPoints.',
                    None, [user.email], fail_silently=True
                )
            except:
                pass 

        return Response({'success': True, 'message': 'Usuario creado exitosamente'})
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([AllowAny])
@authentication_classes([]) # <--- CRUCIAL: Soluciona el error 401 en el Login
def login_user(request):
    data = request.data
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')
    
    user = None
    try:
        # Búsqueda segura insensible a mayúsculas
        user_obj = User.objects.get(email__iexact=email)
        user = authenticate(username=user_obj.username, password=password)
    except User.DoesNotExist:
        pass
    
    if user is not None:
        if not user.is_active:
             return Response({'error': 'Cuenta suspendida.'}, status=status.HTTP_403_FORBIDDEN)

        refresh = RefreshToken.for_user(user)
        
        must_change = False
        if hasattr(user, 'profile'):
            must_change = user.profile.must_change_password

        return Response({
            'success': True,
            'username': user.username,
            'name': user.first_name or "Usuario",
            'is_staff': user.is_staff,
            'must_change_password': must_change,
            'access': str(refresh.access_token),
            'refresh': str(refresh),
        })
    else:
        # Mensaje genérico para no revelar existencia de usuarios
        return Response({'error': 'Credenciales incorrectas'}, status=status.HTTP_401_UNAUTHORIZED)

@api_view(['POST'])
@permission_classes([AllowAny])
@authentication_classes([]) # Permite recuperar contraseña sin estar logueado
def recover_password(request):
    email = request.data.get('email', '').strip().lower()
    try:
        user = User.objects.get(email__iexact=email)
        alphabet = string.ascii_letters + string.digits
        temp_pass = ''.join(secrets.choice(alphabet) for i in range(8))
        user.set_password(temp_pass)
        user.save()
        
        if hasattr(user, 'profile'):
            user.profile.must_change_password = True
            user.profile.save()
            
        # Simulación de envío exitoso por seguridad
        return Response({'success': True, 'message': 'Si el correo existe, se enviaron instrucciones.'})
    except:
        return Response({'success': True, 'message': 'Si el correo existe, se enviaron instrucciones.'})

# --- GESTIÓN DE PERFIL ---

@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated])
def user_profile(request):
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
                if hasattr(user, 'profile'):
                    user.profile.must_change_password = False
                    user.profile.save()
                user.save()
            return Response({'success': True, 'message': 'Perfil actualizado'})
        return Response(serializer.errors, status=400)

# --- ZONA ADMINISTRADOR ---

@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated, IsAdminUser])
def admin_manage_users(request, user_id=None):
    if request.method == 'GET':
        users = User.objects.all().select_related('profile').order_by('-date_joined')
        data = []
        for u in users:
            level = u.profile.level if hasattr(u, 'profile') else "Sin Perfil"
            data.append({
                "id": u.id, "name": u.first_name, "email": u.email,
                "is_active": u.is_active, "level": level, "last_login": u.last_login
            })
        return Response(data)

    elif request.method == 'PUT':
        target_id = request.data.get('user_id')
        try:
            user = User.objects.get(id=target_id)
            if user == request.user: return Response({'error': 'Acción no permitida sobre ti mismo'}, 400)
            user.is_active = not user.is_active
            user.save()
            return Response({'success': True, 'message': 'Estado actualizado.'})
        except: return Response({'error': 'Usuario no encontrado'}, 404)

    elif request.method == 'DELETE':
        try:
            user = User.objects.get(id=user_id)
            if user.is_superuser: return Response({'error': 'No se puede eliminar superadmin'}, 400)
            user.delete()
            return Response({'success': True, 'message': 'Usuario eliminado'})
        except: return Response({'error': 'Error al eliminar'}, 400)

@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdminUser])
def admin_create_task(request):
    serializer = TaskSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response({'success': True, 'message': 'Tarea creada'}, status=201)
    return Response(serializer.errors, status=400)

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminUser])
def admin_dashboard_stats(request):
    total_points = Profile.objects.aggregate(Sum('points'))['points__sum'] or 0
    total_co2 = Profile.objects.aggregate(Sum('co2_saved'))['co2_saved__sum'] or 0
    
    activity = UserTask.objects.annotate(weekday=ExtractWeekDay('completed_at'))\
                               .values('weekday')\
                               .annotate(count=Count('id'))\
                               .order_by('weekday')
    
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
        return Response({'error': 'No encontrada'}, 404)
    
    if request.method == 'DELETE':
        task.delete()
        return Response({'success': True, 'message': 'Eliminada'})
    
    serializer = TaskSerializer(task, data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response({'success': True, 'message': 'Actualizada'})
    return Response(serializer.errors, 400)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_dashboard_data(request):
    try:
        p = request.user.profile
        progress = min(100, int((p.points % 1000) / 10))
        return Response({"points": p.points, "level": p.level, "co2": p.co2_saved, "progress": progress, "weekly_data": []})
    except: return Response({"points": 0}, 400)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_tasks(request):
    tasks = Task.objects.all()
    serializer = TaskSerializer(tasks, many=True)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([AllowAny]) 
@authentication_classes([]) 
def get_ranking(request):
    # FILTRO: Excluir superusuarios (is_superuser=False) y staff (is_staff=False)
    profiles = Profile.objects.filter(user__is_superuser=False, user__is_staff=False).select_related('user').order_by('-points')[:10]
    
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
    material = request.data.get('material_type')
    qty = int(request.data.get('quantity', 1))
    
    try:
        p = user.profile
        points = {'plastic': 10, 'glass': 15, 'paper': 5, 'metal': 20}.get(material, 5) * qty
        task, _ = Task.objects.get_or_create(title=f"Reciclaje: {material}", defaults={'points': points, 'icon_type': 'recycle'})
        UserTask.objects.create(user=user, task=task)
        p.points += points
        p.co2_saved += (qty * 0.15)
        p.save()
        return Response({'success': True, 'message': f'+{points} puntos'})
    except Exception as e:
        return Response({'error': str(e)}, 400)