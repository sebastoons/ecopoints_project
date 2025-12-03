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
import threading # Para emails asíncronos

from .models import Task, Profile, UserTask
from .serializers import TaskSerializer, UserSerializer, UserUpdateSerializer

# --- UTILIDAD: CORREOS EN SEGUNDO PLANO ---
class EmailThread(threading.Thread):
    def __init__(self, subject, message, recipient_list):
        self.subject = subject
        self.message = message
        self.recipient_list = recipient_list
        threading.Thread.__init__(self)

    def run(self):
        try:
            send_mail(
                self.subject, 
                self.message, 
                None, # Usa DEFAULT_FROM_EMAIL de settings
                self.recipient_list, 
                fail_silently=True
            )
        except Exception as e:
            print(f"Error enviando correo en hilo: {e}")

# --- AUTENTICACIÓN ---

@api_view(['POST'])
@permission_classes([AllowAny]) 
@authentication_classes([]) 
def register_user(request):
    data = request.data
    try:
        with transaction.atomic():
            email_clean = data['email'].lower().strip()
            
            if User.objects.filter(email__iexact=email_clean).exists():
                return Response({'error': 'El correo ya está registrado'}, status=400)
            
            user = User.objects.create_user(
                username=email_clean, 
                email=email_clean,
                password=data['password'],
                first_name=data.get('name', '').strip()
            )
            
            # Perfil
            Profile.objects.create(user=user, points=0, level="Eco-Iniciado")
            
            # Tareas por defecto si no existen
            if Task.objects.count() == 0:
                defaults = [
                    {"title": "Reciclar Botellas", "points": 10, "description": "Fácil", "icon_type": "plastic"},
                    {"title": "Usar Bolsa Reutilizable", "points": 5, "description": "Fácil", "icon_type": "bag"},
                ]
                for t in defaults:
                    Task.objects.create(**t)

            # Enviar correo en segundo plano (NO BLOQUEA LA RESPUESTA)
            EmailThread(
                '¡Bienvenido a EcoPoints! 🌿',
                f'Hola {user.first_name},\n\nTu cuenta ha sido creada exitosamente. ¡Gracias por unirte al cambio!',
                [user.email]
            ).start()

        return Response({'success': True, 'message': 'Usuario creado exitosamente'})
    except Exception as e:
        return Response({'error': str(e)}, status=400)

@api_view(['POST'])
@permission_classes([AllowAny])
@authentication_classes([]) 
def login_user(request):
    data = request.data
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')
    
    user = None
    try:
        user_obj = User.objects.get(email__iexact=email)
        user = authenticate(username=user_obj.username, password=password)
    except User.DoesNotExist:
        pass
    
    if user:
        if not user.is_active: return Response({'error': 'Cuenta suspendida'}, 403)
        
        refresh = RefreshToken.for_user(user)
        must_change = False
        if hasattr(user, 'profile'):
            must_change = user.profile.must_change_password

        return Response({
            'success': True,
            'username': user.username,
            'name': user.first_name,
            'is_staff': user.is_staff,
            'must_change_password': must_change,
            'access': str(refresh.access_token),
            'refresh': str(refresh),
        })
    return Response({'error': 'Credenciales incorrectas'}, 401)

@api_view(['POST'])
@permission_classes([AllowAny])
@authentication_classes([]) 
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
            
        EmailThread(
            'Recuperación de Contraseña',
            f'Hola {user.first_name},\n\nTu contraseña temporal es: {temp_pass}\n\nIngresa y cámbiala inmediatamente.',
            [user.email]
        ).start()
    except:
        pass # Por seguridad
    return Response({'success': True, 'message': 'Si el correo existe, se enviaron instrucciones.'})

# --- FUNCIONALIDADES DE USUARIO (TAREAS, HISTORIAL) ---

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def complete_standard_task(request):
    """Permite completar una tarea de la lista estándar"""
    user = request.user
    task_id = request.data.get('task_id')
    
    try:
        task = Task.objects.get(id=task_id)
        # Registramos la tarea completada
        UserTask.objects.create(user=user, task=task)
        
        # Actualizamos perfil
        profile = user.profile
        profile.points += task.points
        profile.co2_saved += (task.points * 0.05) # Estimación
        profile.save()
        
        return Response({
            'success': True, 
            'message': f'¡Has ganado {task.points} puntos!',
            'new_points': profile.points
        })
    except Task.DoesNotExist:
        return Response({'error': 'Tarea no encontrada'}, 404)
    except Exception as e:
        return Response({'error': str(e)}, 400)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_history(request):
    """Devuelve las últimas 10 tareas realizadas para la campanita"""
    history = UserTask.objects.filter(user=request.user).select_related('task').order_by('-completed_at')[:10]
    data = []
    for h in history:
        data.append({
            "title": h.task.title,
            "points": h.task.points,
            "date": h.completed_at.strftime("%d/%m %H:%M")
        })
    return Response(data)

# --- PERFIL Y DASHBOARD ---

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
        return Response(serializer.errors, 400)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_dashboard_data(request):
    try:
        p = request.user.profile
        progress = min(100, int((p.points % 1000) / 10))
        return Response({"points": p.points, "level": p.level, "co2": round(p.co2_saved, 2), "progress": progress, "weekly_data": []})
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
    # Excluir Admin y Staff del ranking
    profiles = Profile.objects.filter(user__is_superuser=False, user__is_staff=False).select_related('user').order_by('-points')[:10]
    data = [{"name": p.user.first_name, "points": p.points} for p in profiles]
    return Response(data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_custom_task(request):
    # Lógica simplificada
    return Response({'success': True, 'message': 'Reciclaje registrado'})

# --- ADMIN ---

@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated, IsAdminUser])
def admin_manage_users(request, user_id=None):
    if request.method == 'GET':
        users = User.objects.all().select_related('profile').order_by('-date_joined')
        data = []
        for u in users:
            level = u.profile.level if hasattr(u, 'profile') else "-"
            data.append({"id": u.id, "name": u.first_name, "email": u.email, "is_active": u.is_active, "level": level})
        return Response(data)
    elif request.method == 'PUT':
        uid = request.data.get('user_id')
        try:
            u = User.objects.get(id=uid)
            if u == request.user: return Response({'error': 'No puedes bloquearte a ti mismo'}, 400)
            u.is_active = not u.is_active
            u.save()
            return Response({'success': True, 'message': 'Estado cambiado'})
        except: return Response({'error': 'Usuario no encontrado'}, 404)
    elif request.method == 'DELETE':
        try:
            u = User.objects.get(id=user_id)
            if u.is_superuser: return Response({'error': 'No puedes borrar superadmin'}, 400)
            u.delete()
            return Response({'success': True, 'message': 'Usuario eliminado'})
        except: return Response({'error': 'Error al eliminar'}, 400)

@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdminUser])
def admin_create_task(request):
    serializer = TaskSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response({'success': True}, 201)
    return Response(serializer.errors, 400)

@api_view(['PUT', 'DELETE'])
@permission_classes([IsAuthenticated, IsAdminUser])
def admin_task_detail(request, task_id):
    try: t = Task.objects.get(id=task_id)
    except: return Response({'error': 'No encontrada'}, 404)
    if request.method == 'DELETE':
        t.delete()
        return Response({'success': True})
    serializer = TaskSerializer(t, data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response({'success': True})
    return Response(serializer.errors, 400)

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminUser])
def admin_dashboard_stats(request):
    tp = Profile.objects.aggregate(Sum('points'))['points__sum'] or 0
    tc = Profile.objects.aggregate(Sum('co2_saved'))['co2_saved__sum'] or 0
    return Response({"total_points": tp, "total_co2": round(tc, 2), "chart_data": []})