from django.http import HttpResponse
from django.shortcuts import render
from rest_framework import viewsets, permissions
from .models import *
from .serializers import *
from .serializers import MiLoginPersonalizadoSerializer
from rest_framework_simplejwt.views import TokenObtainPairView
from .permissions import *
from rest_framework.decorators import action
from rest_framework.response import Response


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
    serializer_class = ExpedienteSerializer
    def get_queryset(self):
        usuario = self.request.user
    
        if usuario.usuario.rol.nombre_rol == 'TS':
            return Expediente.objects.filter(usuario_asignado=usuario)
    
        return Expediente.objects.all()
    
    
    
    def get_permissions(self):
        if self.action == 'create':
            return [IsDataEntry()]
        if self.action == 'destroy':
            return [IsSuperAdmin()]
        else:
            return Response({'mensaje': 'Usuario no autorizado para esta accion'})
        
        return [IsAnyRole()]    
    
    @action(detail=True, methods=['patch'], permission_classes=[IsLegales])
    def cambiar_estado(self, request, pk=None):
        expediente= self.get_object()
        nuevo_estado = request.data.get('estado')
        
        if nuevo_estado in ['AP', 'NoAP']:
            estado_obj = EstadoExpediente.objects.get(nombre=nuevo_estado)
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
    serializer_class = HistorialPaseSerializer
    
    def perform_create(self, serializer):
        # 1. Guardamos el pase con el usuario origen automático
        pase = serializer.save(usuario_origen=self.request.user)
        
        # 2. Agarramos el expediente
        expediente = pase.expediente
        
        # 3. Solo cambiamos estado si no está aprobado
        if expediente.estado_expediente.nombre != 'AP':
            rol_destino = pase.usuario_destino.usuario.rol.nombre_rol
            
            if rol_destino == 'LG':
                nuevo_estado = EstadoExpediente.objects.get(nombre='LEG')
            else:
                nuevo_estado = EstadoExpediente.objects.get(nombre='1V')
            
            expediente.estado_expediente = nuevo_estado
            expediente.save()
        
        # 4. Creamos el historial de acción automáticamente
        HistorialAccion.objects.create(
            mensaje_accion=f"Expediente transferido a {pase.usuario_destino.username}. Motivo: {pase.observacion}",
            id_usuario_accion=self.request.user.usuario,
            id_expediente=expediente
        )
        
        
            
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
    
    def perform_create(self, serializer):
        formulario = serializer.save()
        expediente = formulario.expediente
        estado_1v = EstadoExpediente.objects.get(nombre='1V')
        expediente.estado_expediente = estado_1v
        expediente.save()
    
    
class DictamenLegalViewSet(viewsets.ModelViewSet):
    queryset = DictamenLegal.objects.all()
    permission_classes = [permissions.AllowAny]
    serializer_class = DictamenLegalSerializer
    
class MiLoginPersonalizadoView(TokenObtainPairView):
    serializer_class = MiLoginPersonalizadoSerializer