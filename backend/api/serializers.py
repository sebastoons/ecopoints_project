from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Profile, Task

class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = ['points', 'co2_saved', 'level']

class UserSerializer(serializers.ModelSerializer):
    profile = ProfileSerializer(read_only=True)
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'profile']

class UserUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['first_name', 'email']

class TaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = Task
        fields = '__all__'