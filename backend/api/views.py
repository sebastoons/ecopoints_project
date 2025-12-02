from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from .models import Task, Profile, UserTask
from .serializers import TaskSerializer, UserSerializer, UserUpdateSerializer, ProfileSerializer

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
        # Creamos el perfil inmediatamente
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
        serializer = UserUpdateSerializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response({'success': True, 'message': 'Perfil actualizado', 'data': serializer.data})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# --- DATOS REALES ---

@api_view(['GET'])
def get_dashboard_data(request):
    # Obtener usuario real (en producción usaríamos Token, aquí usamos query param por simplicidad)
    # Si no se envía usuario, devolvemos datos genéricos o error
    email = request.GET.get('username') 
    if not email:
        # Retorno seguro para evitar crash si no hay usuario
        return Response({"points": 0, "co2": 0, "level": "Invitado", "progress": 0, "weekly_data": []})

    try:
        user = User.objects.get(username=email)
        profile = user.profile
        
        # Datos reales de la DB
        data = {
            "points": profile.points,
            "co2": round(profile.co2_saved, 2),
            "level": profile.level,
            "progress": min(100, int((profile.points % 1000) / 10)), # Ejemplo: cada 1000 pts sube nivel
            "weekly_data": [
                {"name": "Lun", "points": 20, "co2": 5},
                {"name": "Mar", "points": 45, "co2": 12}, # Esto se podría calcular con UserTask queries
                {"name": "Mie", "points": 30, "co2": 8},
                {"name": "Jue", "points": 60, "co2": 15},
            ]
        }
        return Response(data)
    except:
         return Response({"points": 0, "co2": 0, "level": "Error", "progress": 0, "weekly_data": []})

@api_view(['GET'])
def get_tasks(request):
    # AHORA SÍ: Devuelve las tareas creadas en el Admin de Django
    tasks = Task.objects.all()
    serializer = TaskSerializer(tasks, many=True)
    return Response(serializer.data)

@api_view(['GET'])
def get_ranking(request):
    # AHORA SÍ: Ordena a los usuarios reales por puntos
    profiles = Profile.objects.select_related('user').order_by('-points')[:10] # Top 10
    
    ranking_data = []
    for p in profiles:
        ranking_data.append({
            "id": p.user.id,
            "name": p.user.first_name or p.user.username,
            "points": p.points
        })
        
    return Response(ranking_data)

@api_view(['POST'])
def create_custom_task(request):
    email = request.data.get('username')
    material_code = request.data.get('code')
    quantity = int(request.data.get('quantity', 1))
    material_type = request.data.get('material_type')

    try:
        user = User.objects.get(username=email)
        profile = user.profile
        
        points_table = {'plastic': 10, 'glass': 15, 'paper': 5, 'metal': 20}
        points_per_unit = points_table.get(material_type, 5)
        total_points = points_per_unit * quantity

        # Guardar tarea
        task_name = f"Reciclaje: {material_type}"
        task_obj, _ = Task.objects.get_or_create(
            title=task_name,
            defaults={'points': points_per_unit, 'description': 'Tarea Manual', 'icon_type': 'recycle'}
        )
        UserTask.objects.create(user=user, task=task_obj)

        # Actualizar Perfil
        profile.points += total_points
        profile.co2_saved += (quantity * 0.15)
        
        # Lógica simple de niveles
        if profile.points > 1000: profile.level = "Eco-Guerrero"
        if profile.points > 5000: profile.level = "Eco-Maestro"
        
        profile.save()

        return Response({
            'success': True, 
            'message': f'+{total_points} Puntos',
            'new_points': profile.points
        })

    except User.DoesNotExist:
        return Response({'error': 'Usuario no encontrado'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)