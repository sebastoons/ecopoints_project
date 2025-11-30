from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from .models import Task, Profile, UserTask
from .serializers import TaskSerializer, UserSerializer, UserUpdateSerializer

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
        # Devolvemos el email como identificador para este demo
        return Response({'success': True, 'username': user.username, 'name': user.first_name})
    else:
        return Response({'error': 'Credenciales inválidas'}, status=status.HTTP_401_UNAUTHORIZED)

# --- PERFIL DE USUARIO (Nuevo) ---

@api_view(['GET', 'PUT'])
def user_profile(request):
    # En un entorno real usaríamos Tokens. Para este demo, pasamos el email como param.
    email = request.GET.get('email') or request.data.get('username')
    
    try:
        user = User.objects.get(username=email)
    except User.DoesNotExist:
        return Response({'error': 'Usuario no encontrado'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        serializer = UserSerializer(user)
        return Response(serializer.data)
    
    elif request.method == 'PUT':
        serializer = UserUpdateSerializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            # Si cambia el email, actualizamos el username también para mantener consistencia
            if 'email' in request.data:
                user.username = request.data['email']
                user.save()
            return Response({'success': True, 'message': 'Perfil actualizado', 'data': serializer.data})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# --- DATOS GENERALES ---

@api_view(['GET'])
def get_dashboard_data(request):
    data = {
        "points": 1250,
        "co2": 450,
        "level": "Eco-Guerrero",
        "progress": 70,
        "weekly_data": [
            {"name": "Sem 1", "points": 140, "co2": 60},
            {"name": "Sem 2", "points": 210, "co2": 80},
            {"name": "Sem 3", "points": 170, "co2": 65},
            {"name": "Sem 4", "points": 280, "co2": 100},
        ]
    }
    return Response(data)

@api_view(['GET'])
def get_tasks(request):
    tasks = [
        {"id": 1, "title": "Reciclar 2 botellas de plástico", "points": 50, "description": "Fácil", "completed": False},
        {"id": 2, "title": "Juntar 3 cajas de pizza", "points": 30, "description": "Fácil", "completed": False},
        {"id": 3, "title": "Donar ropa en desuso", "points": 75, "description": "Medio", "completed": False},
        {"id": 4, "title": "Usar bolsas reutilizables", "points": 20, "description": "Fácil", "completed": True},
        {"id": 5, "title": "Reciclar 6 latas", "points": 60, "description": "Fácil", "completed": False},
    ]
    return Response(tasks)

@api_view(['GET'])
def get_ranking(request):
    ranking = [
        {"id": 1, "name": "Juanjo Durán", "points": 12500},
        {"id": 2, "name": "Ana Morán", "points": 11800},
        {"id": 3, "name": "Pedro Sánchez", "points": 10500},
        {"id": 4, "name": "Laura Calvo", "points": 9800},
        {"id": 5, "name": "Manuel Martín", "points": 8750},
        {"id": 6, "name": "Sofía Robles", "points": 7900},
    ]
    return Response(ranking)

# --- NUEVA VISTA: CREAR TAREA PROPIA ---

@api_view(['POST'])
def create_custom_task(request):
    # 1. Identificar usuario
    email = request.data.get('username') # Enviamos el email/user desde el front
    material_code = request.data.get('code')
    quantity = int(request.data.get('quantity', 1))
    material_type = request.data.get('material_type') # 'Plástico', 'Vidrio', etc.

    try:
        user = User.objects.get(username=email)
        profile = user.profile
        
        # 2. Lógica de Puntos por Material (Simulada)
        points_per_unit = 0
        if material_type == 'plastic':
            points_per_unit = 10
        elif material_type == 'glass':
            points_per_unit = 15
        elif material_type == 'paper':
            points_per_unit = 5
        elif material_type == 'metal':
            points_per_unit = 20
        else:
            points_per_unit = 5 # Default
            
        total_points = points_per_unit * quantity

        # 3. Crear o Buscar una "Tarea Genérica" en BD para registrarla
        # Intentamos buscar una tarea con ese nombre, si no existe, la creamos temporalmente
        task_name = f"Reciclaje: {material_type.capitalize()}"
        task_obj, created = Task.objects.get_or_create(
            title=task_name,
            defaults={'points': points_per_unit, 'description': 'Tarea Propia', 'icon_type': 'recycle'}
        )

        # 4. Guardar en el Historial (UserTask)
        UserTask.objects.create(user=user, task=task_obj)

        # 5. Actualizar Puntos del Perfil
        profile.points += total_points
        profile.co2_saved += (quantity * 0.1) # 0.1kg por unidad (ejemplo)
        profile.save()

        return Response({
            'success': True, 
            'message': f'¡Has ganado {total_points} EcoPoints!',
            'new_points': profile.points
        })

    except User.DoesNotExist:
        return Response({'error': 'Usuario no encontrado'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)