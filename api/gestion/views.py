from django.http import HttpResponse
from django.shortcuts import render
from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from django.contrib.auth.models import User

from .models import *
from .serializers import *
from .serializers import MiLoginPersonalizadoSerializer
from rest_framework_simplejwt.views import TokenObtainPairView


# transiciones de estado válidas. 'SI': sin iniciar, '1V': primera visita, 'LG': legales, 'NV': no válido, 'AP': apto, 'NA': no apto
ESTADOS_VALIDOS = {
    'Sin Iniciar': ['1ra Visita'],
    '1ra Visita': ['Legales', 'Nueva Visita'],
    'Nueva Visita': ['1ra Visita'],
    'Legales': ['Doc Presentada', 'No Apto'],
    'Doc Presentada': ['Apto', 'No Apto'],
    'Apto': [],
    'No Apto': [],
}


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


# logica del negocio principal
class ExpedienteViewSet(viewsets.ModelViewSet):
    queryset = Expediente.objects.all()
    permission_classes = [permissions.AllowAny]
    serializer_class = ExpedienteSerializer

    # 🔹 Transiciones válidas (CÓDIGOS)
    VALID_TRANSITIONS = {
        'SinI': ['1V'],
        '1V': ['Leg', 'NuevaV'],
        'NuevaV': ['1V'],
        'Leg': ['DocP', 'NoAP'],
        'DocP': ['AP', 'NoAP'],
        'AP': [],
        'NoAP': [],
    }

    # estado default al crear
    def perform_create(self, serializer):
        estado_inicial, _ = EstadoExpediente.objects.get_or_create(
            nombre='SinI'
        )

        instance = serializer.save(estado_expediente=estado_inicial)

        # historial
        if hasattr(self.request.user, 'usuario'):
            HistorialAccion.objects.create(
                mensaje_accion="Expediente creado",
                id_usuario_accion=self.request.user.usuario,
                id_expediente=instance
            )

    # validar transición
    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        new_estado_id = request.data.get("estado_expediente")

        if new_estado_id:
            try:
                nuevo_estado = EstadoExpediente.objects.get(id=new_estado_id)
            except EstadoExpediente.DoesNotExist:
                return Response({"error": "Estado inválido"}, status=400)

            estado_actual = instance.estado_expediente.nombre

            if nuevo_estado.nombre not in self.VALID_TRANSITIONS.get(estado_actual, []):
                return Response(
                    {"error": f"No se puede pasar de {estado_actual} a {nuevo_estado.nombre}"},
                    status=400
                )

        return super().update(request, *args, **kwargs)

    # lógica del negocio al actualizar
    def perform_update(self, serializer):
        old_instance = self.get_object()
        old_estado = old_instance.estado_expediente.nombre

        instance = serializer.save()
        new_estado = instance.estado_expediente.nombre

        mensaje = "Expediente actualizado"

        if old_estado != new_estado:
            mensaje = f"Estado cambiado de {old_estado} a {new_estado}"

            # notificación
            if instance.usuario_asignado:
                Notificacion.objects.create(
                    mensaje=mensaje,
                    usuario_destino=instance.usuario_asignado,
                    expediente_relacionado=instance
                )

            # autoasignación según estado
            if new_estado == 'Leg':
                usuario_legal = User.objects.filter(usuario__rol__nombre_rol='LG').first()
                if usuario_legal:
                    instance.usuario_asignado = usuario_legal
                    instance.save()

            elif new_estado == '1V':
                usuario_ts = User.objects.filter(usuario__rol__nombre_rol='TS').first()
                if usuario_ts:
                    instance.usuario_asignado = usuario_ts
                    instance.save()

        # historial
        if hasattr(self.request.user, 'usuario'):
            HistorialAccion.objects.create(
                mensaje_accion=mensaje,
                id_usuario_accion=self.request.user.usuario,
                id_expediente=instance
            )

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
    serializer_class = HistorialPaseSerializer  # 🔧 FIXED


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