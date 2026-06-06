from django.urls import path, include
from .views import *
from .views import MiLoginPersonalizadoView, UsuarioViewSet
from rest_framework.routers import DefaultRouter
from django.contrib import admin
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView


router = DefaultRouter()

router.register(r'postulantetitular', PostulanteTitularViewSet)
router.register(r'integrantefamilia', IntegranteFamiliaViewSet)
router.register(r'estadoexpediente', EstadoExpedienteViewSet)
router.register(r'expediente', ExpedienteViewSet, basename='expediente')
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

    # rutas de login
    path('api/login/', MiLoginPersonalizadoView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path(
        'api/establecer-password-inicial/',
        EstablecerPasswordInicialView.as_view(),
        name='establecer_password_inicial'
    ),
    path('api/password-reset/solicitar/', SolicitarResetPasswordView.as_view(), name='password_reset_solicitar'),
    path('api/password-reset/confirmar/', ConfirmarResetPasswordView.as_view(), name='password_reset_confirmar'),
]
