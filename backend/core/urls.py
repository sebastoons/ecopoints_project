from django.contrib import admin
from django.urls import path
from api import views

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/register/', views.register_user),
    path('api/login/', views.login_user),
    path('api/recover/', views.recover_password), # <--- NUEVA RUTA
    path('api/profile/', views.user_profile),
    path('api/dashboard/', views.get_dashboard_data),
    path('api/tasks/', views.get_tasks),
    path('api/ranking/', views.get_ranking),
    path('api/custom-task/', views.create_custom_task),
]