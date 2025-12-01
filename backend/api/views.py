from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from .models import Task, Profile, UserTask
from .serializers import TaskSerializer, UserSerializer

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
        # Nivel inicial
        Profile.objects.create(user=user, points=0, level="Eco-Iniciado")
        return Response({'success': True, 'message': 'Usuario creado correctamente'})
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

# --- PERFIL ---

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
        user.first_name = request.data.get('first_name', user.first_name)
        new_email = request.data.get('email', user.email)
        
        if new_email != user.email:
            if User.objects.filter(username=new_email).exists():
                return Response({'error': 'Correo en uso'}, status=status.HTTP_400_BAD_REQUEST)
            user.username = new_email
            user.email = new_email

        password = request.data.get('password')
        if password:
            user.set_password(password)
            
        user.save()
        return Response({'success': True, 'message': 'Perfil actualizado'})

# --- DASHBOARD CON LOGICA DE NIVELES ---

def calculate_level_progress(points):
    # Definición de Niveles
    levels = [
        (0, 499, "Eco-Iniciado"),
        (500, 1499, "Eco-Explorador"),
        (1500, 2999, "Eco-Agente"),
        (3000, 4999, "Eco-Maestro"),
        (5000, 999999, "Eco-Leyenda"),
    ]
    
    current_level = "Eco-Iniciado"
    next_level_points = 500
    progress = 0

    for min_p, max_p, name in levels:
        if min_p <= points <= max_p:
            current_level = name
            next_level_points = max_p + 1
            # Calcular porcentaje de progreso hacia el siguiente nivel
            range_span = max_p - min_p + 1
            points_in_level = points - min_p
            progress = int((points_in_level / range_span) * 100)
            break
            
    # Caso borde Eco-Leyenda (siempre 100%)
    if points >= 5000:
        progress = 100
        
    return current_level, progress

@api_view(['GET'])
def get_dashboard_data(request):
    email = request.GET.get('username')
    
    # Datos por defecto (si no hay usuario o error)
    dashboard_data = {
        "points": 0,
        "co2": 0,
        "level": "Eco-Iniciado",
        "progress": 0,
        "weekly_data": []
    }

    if not email:
        return Response(dashboard_data)

    try:
        user = User.objects.get(username=email)
        profile = user.profile
        
        level_name, progress_pct = calculate_level_progress(profile.points)
        
        # Actualizar nivel en BD si cambió
        if profile.level != level_name:
            profile.level = level_name
            profile.save()

        # Generar datos semanales simulados solo si tiene puntos
        weekly_data = []
        if profile.points > 0:
            # Simulamos distribución para el gráfico
            base = profile.points // 4
            weekly_data = [
                {"name": "Sem 1", "points": int(base * 0.8), "co2": int(base * 0.8 * 0.2)},
                {"name": "Sem 2", "points": int(base * 1.2), "co2": int(base * 1.2 * 0.2)},
                {"name": "Sem 3", "points": int(base * 0.9), "co2": int(base * 0.9 * 0.2)},
                {"name": "Sem 4", "points": int(base * 1.1), "co2": int(base * 1.1 * 0.2)},
            ]

        dashboard_data = {
            "points": profile.points,
            "co2": round(profile.co2_saved, 1),
            "level": level_name,
            "progress": progress_pct,
            "weekly_data": weekly_data
        }
        
    except User.DoesNotExist:
        pass # Retorna data vacía por defecto

    return Response(dashboard_data)

@api_view(['GET'])
def get_tasks(request):
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
            "name": p.user.first_name or "Anónimo",
            "points": p.points
        })
    return Response(ranking_data)

@api_view(['POST'])
def create_custom_task(request):
    email = request.data.get('username')
    quantity = int(request.data.get('quantity', 1))
    material_type = request.data.get('material_type')

    try:
        user = User.objects.get(username=email)
        profile = user.profile
        
        points_map = {'plastic': 10, 'glass': 15, 'paper': 5, 'metal': 20}
        points_per_unit = points_map.get(material_type, 5)
        total_points = points_per_unit * quantity

        # Crear/Buscar tarea genérica
        task_title = f"Reciclaje: {material_type.capitalize()}"
        task_obj, _ = Task.objects.get_or_create(
            title=task_title,
            defaults={'points': points_per_unit, 'description': 'Manual', 'icon_type': 'recycle'}
        )

        UserTask.objects.create(user=user, task=task_obj)

        profile.points += total_points
        profile.co2_saved += (quantity * 0.15)
        
        # Recalcular nivel inmediatamente
        new_level, _ = calculate_level_progress(profile.points)
        profile.level = new_level
        profile.save()

        return Response({
            'success': True, 
            'message': f'¡Has ganado {total_points} EcoPoints!',
            'new_points': profile.points
        })

    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)