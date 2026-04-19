from django.urls import path, include
from .views import *
from rest_framework.routers import DefaultRouter
from django.contrib import admin


router = DefaultRouter()

router.register(r'postulantetitular', PostulanteTitularViewSet)
router.register(r'integrantefamilia', IntegranteFamiliaViewSet)
router.register(r'estadoexpediente', EstadoExpedienteViewSet)
router.register(r'expediente', ExpedienteViewSet)
router.register(r'rol', RolViewSet)
router.register(r'usuario', UsuarioViewSet)
router.register(r'documentoadjunto', DocumentoAdjuntoViewSet)
router.register(r'historialpase', HistorialPaseViewSet)
router.register(r'notificacion', NotificacionViewSet)
router.register(r'historialaccion', HistorialAccionViewSet)
router.register(r'formulario', FormularioSocioHabitacionalViewSet)
router.register(r'dictamen', DictamenLegalViewSet)

urlpatterns = [
    path('api/', include(router.urls)),
   
    ]

