from django.http import HttpResponse
from django.shortcuts import render
from rest_framework import viewsets, permissions
from .models import *
from .serializers import *
from .serializers import MiLoginPersonalizadoSerializer
from rest_framework_simplejwt.views import TokenObtainPairView

class PostulanteTitularViewSet(viewsets.ModelViewSet):
    queryset = PostulanteTitular.objects.all()
    permission_classes = [permissions.AllowAny]
    serializer_class = PostulanteTitularSerializer

class IntegranteFamiliaViewSet(viewsets.ModelViewSet):
    queryset = IntegranteFamilia.objects.all()
    permission_classes = [permissions.AllowAny]
    serializer_class = IntegranteFamiliaSerializer
    
class EstadoExpedienteViewSet(viewsets.ModelViewSet):
    queryset = EstadoExpediente.objects.all()
    permission_classes = [permissions.AllowAny]
    serializer_class = EstadoExpedienteSerializer
    
class ExpedienteViewSet(viewsets.ModelViewSet):
    queryset = Expediente.objects.all()
    permission_classes = [permissions.AllowAny]
    serializer_class = ExpedienteSerializer
    
class RolViewSet(viewsets.ModelViewSet):
    queryset = Rol.objects.all()
    permission_classes = [permissions.AllowAny]
    serializer_class = RolSerializer
    
class UsuarioViewSet(viewsets.ModelViewSet):
    queryset = Usuario.objects.all()
    permission_classes = [permissions.AllowAny]
    serializer_class = UsuarioSerializer
    
class DocumentoAdjuntoViewSet(viewsets.ModelViewSet):
    queryset = DocumentoAdjunto.objects.all()
    permission_classes = [permissions.AllowAny]
    serializer_class = DocumentoAdjuntoSerializer        

class HistorialPaseViewSet(viewsets.ModelViewSet):
    queryset = HistorialPase.objects.all()
    permission_classes = [permissions.AllowAny]
    serializer_class = HistorialAccionSerializer
    
class NotificacionViewSet(viewsets.ModelViewSet):
    queryset = Notificacion.objects.all()
    permission_classes = [permissions.AllowAny]
    serializer_class = NotificacionSerializer

class HistorialAccionViewSet(viewsets.ModelViewSet):
    queryset = HistorialAccion.objects.all()
    permission_classes = [permissions.AllowAny]
    serializer_class = HistorialAccionSerializer
    
class FormularioSocioHabitacionalViewSet(viewsets.ModelViewSet):
    queryset = FormularioSocioHabitacional.objects.all()
    permission_classes = [permissions.AllowAny]
    serializer_class = FormularioSocioHabitacionalSerializer
    
class DictamenLegalViewSet(viewsets.ModelViewSet):
    queryset = DictamenLegal.objects.all()
    permission_classes = [permissions.AllowAny]
    serializer_class = DictamenLegalSerializer
    
class MiLoginPersonalizadoView(TokenObtainPairView):
    serializer_class = MiLoginPersonalizadoSerializer