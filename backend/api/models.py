from django.db import models
from django.contrib.auth.models import User

class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    points = models.IntegerField(default=0)
    co2_saved = models.FloatField(default=0.0)
    level = models.CharField(max_length=50, default="Eco-Iniciado")
    
    def __str__(self):
        return f"{self.user.username} - {self.points} pts"

class Task(models.Model):
    title = models.CharField(max_length=200)
    points = models.IntegerField()
    description = models.CharField(max_length=50, default="Fácil")
    icon_type = models.CharField(max_length=50, default="recycle")
    
    def __str__(self):
        return self.title

class UserTask(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    task = models.ForeignKey(Task, on_delete=models.CASCADE)
    completed_at = models.DateTimeField(auto_now_add=True)