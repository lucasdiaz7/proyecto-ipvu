from django.urls import path
from . import views
from django.contrib import admin
from django.urls import path
from gestion.views import pantalla_inicio # Importamos la vista que creaste recién

urlpatterns = [
    path('admin/', admin.site.urls),
    # Esta es tu página nueva. Si dejan las comillas vacías '', es la página de inicio (localhost:8000)
    path('', pantalla_inicio, name='inicio'), 
    path('holamundo/', views.saludo_principal)
    ]

