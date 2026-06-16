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
from rest_framework.mixins import ListModelMixin, RetrieveModelMixin, CreateModelMixin
from rest_framework.viewsets import GenericViewSet
from django.contrib.auth.models import User
from rest_framework.views import APIView
from rest_framework_simplejwt.authentication import JWTAuthentication
from django.conf import settings
from django.core.mail import send_mail
from django.contrib.auth.tokens import default_token_generator
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode
from django.db.models import Q


class PostulanteTitularViewSet(viewsets.ModelViewSet):
    queryset = PostulanteTitular.objects.all()
    serializer_class = PostulanteTitularSerializer

    def perform_create(self, serializer):   
        ddjj = serializer.validated_data.pop('ddjj')
        print(f"DDJJ recibida: {ddjj}")
        postulante = serializer.save()
        print(f"Postulante creado: {postulante.id}")
        estado_inicial = EstadoExpediente.objects.get(nombre='SINI')
        print(f"Estado inicial: {estado_inicial}")
        trabajadora_social = obtener_siguiente_trabajadora_social()
        Expediente.objects.create(
            postulante_titular=postulante,
            estado_expediente=estado_inicial,
            DDJJ=ddjj,
            usuario_asignado=trabajadora_social
    )
    print("Expediente creado")

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update']:
            return [IsDataEntryOrSuperAdmin()]
        if self.action == 'destroy':
            return [IsSuperAdmin()]
        return [IsAnyRole()]
    
class IntegranteFamiliaViewSet(viewsets.ModelViewSet):
    queryset = IntegranteFamilia.objects.all()
    serializer_class = IntegranteFamiliaSerializer
 
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update']:
            return [IsDataEntryOrSuperAdmin()]
        if self.action == 'destroy':
            return [IsSuperAdmin()]
        return [IsAnyRole()]
 
class EstadoExpedienteViewSet(ListModelMixin, RetrieveModelMixin, GenericViewSet):
    queryset = EstadoExpediente.objects.all()
    permission_classes = [IsAnyRole]
    serializer_class = EstadoExpedienteSerializer



def obtener_siguiente_trabajadora_social():
    trabajadoras = list(
        User.objects
        .filter(usuario__rol__nombre_rol="TS")
        .order_by("id")
    )

    if not trabajadoras:
        return None

    ultimo_expediente = (
        Expediente.objects
        .filter(usuario_asignado__usuario__rol__nombre_rol="TS")
        .order_by("-id")
        .first()
    )

    if not ultimo_expediente or not ultimo_expediente.usuario_asignado:
        return trabajadoras[0]

    ultimo_usuario = ultimo_expediente.usuario_asignado

    try:
        indice_actual = trabajadoras.index(ultimo_usuario)
    except ValueError:
        return trabajadoras[0]

    siguiente_indice = indice_actual + 1

    if siguiente_indice >= len(trabajadoras):
        siguiente_indice = 0

    return trabajadoras[siguiente_indice]

class ExpedienteViewSet(viewsets.ModelViewSet):
    serializer_class = ExpedienteSerializer

    def perform_create(self, serializer):
        trabajadora_social = obtener_siguiente_trabajadora_social()
        serializer.save(usuario_asignado=trabajadora_social)

    def get_queryset(self):
        usuario = self.request.user
        
        buscar = self.request.query_params.get('buscars')
        estado = self.request.query_params.get('estado')
        dni = self.request.query_params.get('dni')
        usuario_asignado = self.request.query_params.get('usuario_asignado')
        
        if not usuario.is_authenticated:
            queryset = Expediente.objects.all()
        elif usuario.usuario.rol.nombre_rol == 'TS':
            queryset = Expediente.objects.filter(usuario_asignado= usuario)
        else:
            queryset = Expediente.objects.all()

        if buscar:
            palabras = buscar.split()
            for palabra in palabras:
                queryset = queryset.filter(
                    Q(postulante_titular__nombre__icontains=palabra)|
                    Q(postulante_titular__apellido__icontains=palabra)
                )

        if estado:
            queryset = queryset.filter(estado_expediente__nombre = estado)
            
        if dni:
            queryset = queryset.filter(postulante_titular__dni = dni)
            
        if usuario_asignado:
            queryset = queryset.filter(usuario_asignado = usuario_asignado)
            
        return queryset   
    
    def get_permissions(self):
        if self.action == 'create':
            return [permissions.AllowAny()]
        if self.action in ['destroy', 'update', 'partial_update']:
            return [IsSuperAdmin()]
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

class RolViewSet(ListModelMixin, RetrieveModelMixin, GenericViewSet):
    queryset = Rol.objects.all()
    permission_classes = [IsAnyRole]
    serializer_class = RolSerializer
    
class UsuarioViewSet(viewsets.ModelViewSet):
    queryset = Usuario.objects.all()
    serializer_class = UsuarioSerializer
    
    def get_permissions(self):
        if self.action in ['create', 'destroy', 'update', 'partial_update']:
            return [IsSuperAdmin()]
        return [IsAnyRole()]
    
    def get_queryset(self):
        queryset = Usuario.objects.all()
        rol= self.request.query_params.get('rol')

        if rol:
            queryset = queryset.filter(rol__nombre_rol=rol)
            
        return queryset
    
    
class DocumentoAdjuntoViewSet(viewsets.ModelViewSet):
    queryset = DocumentoAdjunto.objects.all()
    permission_classes = [IsAnyRole]
    serializer_class = DocumentoAdjuntoSerializer        

class HistorialPaseViewSet(ListModelMixin, RetrieveModelMixin, CreateModelMixin, GenericViewSet):
    queryset = HistorialPase.objects.all()
    permission_classes = [IsAnyRole]
    serializer_class = HistorialPaseSerializer
    
    def perform_create(self, serializer):
        # 1. Guardamos el pase con el usuario origen automático
        pase = serializer.save(usuario_origen=self.request.user)
        
        expediente = pase.expediente
        
        if expediente.estado_expediente.nombre != 'AP':
            rol_destino = pase.usuario_destino.usuario.rol.nombre_rol
            
            if rol_destino == 'LG':
                nuevo_estado = EstadoExpediente.objects.get(nombre='LEG')
            else:
                nuevo_estado = EstadoExpediente.objects.get(nombre='1V')
            
            expediente.estado_expediente = nuevo_estado
            expediente.save()
        
        #HistorialAccion.objects.create(
            #mensaje_accion=f"Expediente transferido a {pase.usuario_destino.username}. Motivo: {pase.observacion}",
            #id_usuario_accion=self.request.user.usuario,
            #id_expediente=expediente
        #)
        
        
            
class NotificacionViewSet(viewsets.ModelViewSet):
    queryset = Notificacion.objects.all()
    serializer_class = NotificacionSerializer

    def get_permissions(self):
        if self.action == 'create':
            return [IsSuperAdmin()]
        return [IsAnyRole()]

class HistorialAccionViewSet(ListModelMixin, RetrieveModelMixin, GenericViewSet):
    queryset = HistorialAccion.objects.all()
    permission_classes = [IsAnyRole]
    serializer_class = HistorialAccionSerializer
    
class FormularioSocioHabitacionalViewSet(ListModelMixin, RetrieveModelMixin, CreateModelMixin, GenericViewSet):
    queryset = FormularioSocioHabitacional.objects.all()
    serializer_class = FormularioSocioHabitacionalSerializer
    
    def perform_create(self, serializer):
        formulario = serializer.save()
        expediente = formulario.expediente
        estado_1v = EstadoExpediente.objects.get(nombre='1V')
        expediente.estado_expediente = estado_1v
        expediente.save()
    
    def get_permissions(self):
        if self.action == 'create':
            return [IsTrabajadoraSocial()]
        return [IsAnyRole()]
    
class DictamenLegalViewSet(viewsets.ModelViewSet):
    queryset = DictamenLegal.objects.all()
    serializer_class = DictamenLegalSerializer
    
    def get_permissions(self):
        if self.action in ['create', 'destroy']:
            return [IsLegales()]
        return [IsAnyRole()]
    
class MiLoginPersonalizadoView(TokenObtainPairView):
    serializer_class = MiLoginPersonalizadoSerializer


class EstablecerPasswordInicialView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = EstablecerPasswordInicialSerializer(
            data=request.data,
            context={"request": request}
        )

        serializer.is_valid(raise_exception=True)    
        serializer.save()

        return Response({"mensaje": "Contraseña actualizada correctamente"})

class SolicitarResetPasswordView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = SolicitarResetPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data["email"]
        usuario = User.objects.filter(email=email).first()

        if usuario:
            uid = urlsafe_base64_encode(force_bytes(usuario.pk))
            token = default_token_generator.make_token(usuario)
            reset_link = f"{settings.FRONTEND_URL}/reset-password/{uid}/{token}/"

            send_mail(
                subject="Restablecer contraseña",
                message=(
                    "Recibimos una solicitud para restablecer tu password.\n\n"
                    f"Usa este enlace para crear una password nueva:\n{reset_link}\n\n"
                    "Si no solicitaste este cambio, puedes ignorar este mensaje."
                ),
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[usuario.email],
                fail_silently=False,
            )

        return Response({
            "mensaje": "Si el email existe, se enviaron instrucciones para resetear la contraseña."
        })


class ConfirmarResetPasswordView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = ConfirmarResetPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response({
            "mensaje": "Contraseña actualizada correctamente."
        })

