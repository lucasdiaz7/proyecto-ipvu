from django.http import HttpResponse
from django.shortcuts import render
from rest_framework import viewsets, permissions
from .models import *
from .serializers import *
from .serializers import MiLoginPersonalizadoSerializer
from rest_framework_simplejwt.views import TokenObtainPairView
from .permissions import *
from rest_framework.decorators import action


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
    serializer_class = ExpedienteSerializer
    
    def get_permissions(self):
        if self.action == 'create':
            return [IsDataEntry()]
        if self.action == 'destroy':
            return [IsSuperAdmin()]
        
        return [IsDataEntry() | IsSuperAdmin() | IsTrabajadoraSocial() | IsLegales()]
    
    @action(detail=True, methods=['patch'], permission_classes=[IsLegales])
    def cambiar_estado(self, request, pk=None):
        expediente= self.get_object()
        nuevo_estado = request.data.get('estado')
        
        if nuevo_estado in ['AP', 'NoAP']:
            estado_obj = EstadoExpediente.objects.get(tipo_estado=nuevo_estado)
            expediente.estado_expediente = estado_obj
            expediente.save()
            return Response ({'mensaje': 'Estado actualizado'})
        else:
            return Response ({'mensaje': 'Estado no válido'})
        
        
        
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