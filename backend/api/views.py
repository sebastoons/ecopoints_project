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
import secrets # Para generar contraseña segura
import string

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
        seed_database() 
        
        # CORREO DE BIENVENIDA REAL
        try:
            send_mail(
                '¡Bienvenido a EcoPoints! 🌿',
                f'Hola {user.first_name},\n\nGracias por unirte a la comunidad que cuida el planeta. ¡Empieza a registrar tus acciones hoy y gana puntos!\n\nSaludos,\nEl equipo EcoPoints.',
                None, # Usa DEFAULT_FROM_EMAIL
                [user.email],
                fail_silently=True,
            )
        except:
            pass 

        return Response({'success': True, 'message': 'Usuario creado y notificado'})
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
def login_user(request):
    data = request.data
    email = data.get('email')
    password = data.get('password')
    
    # Lógica inteligente: intenta por username=email, luego por email real
    user = authenticate(username=email, password=password)
    if user is None:
        try:
            user_obj = User.objects.get(email=email)
            user = authenticate(username=user_obj.username, password=password)
        except User.DoesNotExist:
            pass
    
    if user is not None:
        if not user.is_active:
             return Response({'error': 'Cuenta suspendida. Contacte al administrador.'}, status=status.HTTP_403_FORBIDDEN)

        refresh = RefreshToken.for_user(user)
        
        # Verificar cambio forzado
        must_change = False
        if hasattr(user, 'profile'):
            must_change = user.profile.must_change_password

        return Response({
            'success': True,
            'username': user.username,
            'name': user.first_name or "Usuario",
            'is_staff': user.is_staff,
            'must_change_password': must_change, # <--- ENVIAR FLAG
            'access': str(refresh.access_token),
            'refresh': str(refresh),
        })
    else:
        return Response({'error': 'Credenciales inválidas'}, status=status.HTTP_401_UNAUTHORIZED)

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
                # Si cambia la contraseña, quitamos la obligación
                if hasattr(user, 'profile'):
                    user.profile.must_change_password = False
                    user.profile.save()
                user.save()
            return Response({'success': True, 'message': 'Perfil actualizado'})
        return Response(serializer.errors, status=400)

@api_view(['POST'])
def recover_password(request):
    email = request.data.get('email')
    try:
        user = User.objects.get(email=email)
        
        # 1. Generar contraseña temporal (8 caracteres alfanuméricos)
        alphabet = string.ascii_letters + string.digits
        temp_password = ''.join(secrets.choice(alphabet) for i in range(8))
        
        # 2. Guardar en usuario
        user.set_password(temp_password)
        user.save()
        
        # 3. Marcar cambio obligatorio
        if not hasattr(user, 'profile'):
            Profile.objects.create(user=user)
        user.profile.must_change_password = True
        user.profile.save()
        
        # 4. Enviar correo
        subject = 'Recuperación de Contraseña - EcoPoints'
        message = f"""
        Hola {user.first_name},

        Hemos recibido una solicitud para restablecer tu contraseña.
        
        Tu contraseña temporal es: {temp_password}
        
        Úsala para iniciar sesión. El sistema te pedirá cambiarla inmediatamente por seguridad.
        
        Si no solicitaste esto, ignora este correo.
        """
        
        send_mail(subject, message, None, [email], fail_silently=False)
        return Response({'success': True, 'message': 'Correo enviado con instrucciones.'})
    except User.DoesNotExist:
        return Response({'success': True, 'message': 'Si el correo existe, se enviaron instrucciones.'}) # Seguridad
    except Exception as e:
        return Response({'error': 'Error enviando correo'}, status=500)

# --- ZONA ADMINISTRADOR ---

@api_view(['GET', 'PUT', 'DELETE']) # Agregamos DELETE
@permission_classes([IsAuthenticated, IsAdminUser])
def admin_manage_users(request, user_id=None):
    if request.method == 'GET':
        users = User.objects.all().select_related('profile')
        data = []
        for u in users:
            try: level = u.profile.level
            except: level = "Admin/Sin Perfil"
            data.append({
                "id": u.id, "name": u.first_name, "email": u.email,
                "is_active": u.is_active, "level": level, "last_login": u.last_login
            })
        return Response(data)

    elif request.method == 'PUT':
        target_id = request.data.get('user_id')
        try:
            user = User.objects.get(id=target_id)
            if user == request.user: return Response({'error': 'No puedes autodesactivarte'}, 400)
            user.is_active = not user.is_active
            user.save()
            msg = "activado" if user.is_active else "suspendido"
            return Response({'success': True, 'message': f'Usuario {msg}.'})
        except: return Response({'error': 'Usuario no encontrado'}, 404)

    elif request.method == 'DELETE': # Lógica de eliminar
        try:
            user = User.objects.get(id=user_id)
            if user.is_superuser: return Response({'error': 'No se puede borrar superadmin'}, 400)
            if user == request.user: return Response({'error': 'No puedes borrarte a ti mismo'}, 400)
            user.delete()
            return Response({'success': True, 'message': 'Usuario eliminado permanentemente'})
        except User.DoesNotExist:
            return Response({'error': 'Usuario no encontrado'}, 404)

# ... (Mantener admin_create_task, admin_dashboard_stats, admin_task_detail, get_dashboard_data, get_tasks, get_ranking, create_custom_task IGUALES)
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
        task_obj, _ = Task.objects.get_or_create(title=task_name, defaults={'points': points, 'icon_type': 'recycle'})
        
        UserTask.objects.create(user=user, task=task_obj)
        
        profile.points += points
        profile.co2_saved += (quantity * 0.15)
        profile.save()
        
        return Response({'success': True, 'message': f'+{points} puntos agregados'})
    except Exception as e:
        return Response({'error': str(e)}, status=400)