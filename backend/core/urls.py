from django.contrib import admin
from django.urls import path
from api import views

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # Autenticación
    path('api/register/', views.register_user),
    path('api/login/', views.login_user),
    path('api/recover/', views.recover_password),
    
    # Usuario General
    path('api/profile/', views.user_profile),
    path('api/dashboard/', views.get_dashboard_data),
    path('api/tasks/', views.get_tasks),
    path('api/ranking/', views.get_ranking),
    path('api/custom-task/', views.create_custom_task),
    
    # --- NUEVOS ENDPOINTS ---
    path('api/task/complete/', views.complete_standard_task), 
    path('api/history/', views.get_user_history),   
              
    # Admin
    path('api/admin/users/', views.admin_manage_users),
    path('api/admin/users/<int:user_id>/', views.admin_manage_users),
    path('api/admin/tasks/create/', views.admin_create_task),
    path('api/admin/tasks/<int:task_id>/', views.admin_task_detail),
    path('api/admin/dashboard/', views.admin_dashboard_stats),
]