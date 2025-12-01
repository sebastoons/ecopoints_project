from django.contrib import admin
from .models import Profile, Task, UserTask

# Configuración para ver mejor los datos en el panel
class ProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'points', 'level', 'co2_saved')
    search_fields = ('user__username', 'user__first_name')

class TaskAdmin(admin.ModelAdmin):
    list_display = ('title', 'points', 'description', 'icon_type')
    list_filter = ('points', 'icon_type')

class UserTaskAdmin(admin.ModelAdmin):
    list_display = ('user', 'task', 'completed_at')
    list_filter = ('completed_at',)

# Registrar modelos
admin.site.register(Profile, ProfileAdmin)
admin.site.register(Task, TaskAdmin)
admin.site.register(UserTask, UserTaskAdmin)