import csv
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
from rest_framework.mixins import ListModelMixin, RetrieveModelMixin, CreateModelMixin, UpdateModelMixin
from rest_framework.viewsets import GenericViewSet
from django.contrib.auth.models import User
from rest_framework.views import APIView
from rest_framework_simplejwt.authentication import JWTAuthentication
from django.conf import settings
from django.core.mail import send_mail
from django.contrib.auth.tokens import default_token_generator
from django.db.models import Count
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode
from django.db.models import Q
from django.db.models import Count


# Notificaciones automaticas. meensajes posibles al recibir un expediente
MENSAJE_NUEVO_CASO = "Nuevo caso recibido"
MENSAJE_CASO_RECIBIDO = "Caso recibido"
ROLES_CON_NOTIFICACION_DE_CASO = ['TS', 'LG']


# verifica si el usuario destino pertenece a un rol que debe recibir notificaciones de expedientes, o sea, LG y TS
def usuario_puede_recibir_notificacion_caso(usuario_destino):
    if not usuario_destino:
        return False

    perfil_destino = getattr(usuario_destino, 'usuario', None)

    if not perfil_destino:
        return False

    return perfil_destino.rol.nombre_rol in ROLES_CON_NOTIFICACION_DE_CASO


# determina si el usuario ya habia recibido antes el mismo expediente para que el la notificacion no diga NUEVO
# se revisan notificaciones previas y pases anteriores el pase actual se excluye para no contarlo como antecedente 
def usuario_recibio_expediente_antes(usuario_destino, expediente, pase_actual=None):
    notificacion_previa = Notificacion.objects.filter(
        usuario_destino=usuario_destino,
        expediente_relacionado=expediente
    ).exists()

    pases_previos = HistorialPase.objects.filter(
        expediente=expediente,
        usuario_destino=usuario_destino
    )
    # evita contar el pase actual como un pase previo
    if pase_actual:
        pases_previos = pases_previos.exclude(id=pase_actual.id)

    return notificacion_previa or pases_previos.exists()


# crea la notificacion cuando un usuario de TS o Legales recibe un expediente
# si es la primera vez q recibe muestra Nuevo caso recibido. si ya lo recibio antes muestra Caso recibido
def crear_notificacion_recepcion_expediente(usuario_destino, expediente, pase_actual=None):
    if not usuario_puede_recibir_notificacion_caso(usuario_destino):
        return

    recibio_antes = usuario_recibio_expediente_antes(
        usuario_destino=usuario_destino,
        expediente=expediente,
        pase_actual=pase_actual
    )

    mensaje = MENSAJE_CASO_RECIBIDO if recibio_antes else MENSAJE_NUEVO_CASO

    Notificacion.objects.create(
        mensaje=mensaje,
        usuario_destino=usuario_destino,
        expediente_relacionado=expediente
    )


class PostulanteTitularViewSet(viewsets.ModelViewSet):
    queryset = PostulanteTitular.objects.all()
    serializer_class = PostulanteTitularSerializer

    def perform_create(self, serializer):   
        ddjj = serializer.validated_data.pop('ddjj')
        postulante = serializer.save()
        estado_inicial = EstadoExpediente.objects.get(nombre='SINI')
        trabajadora_social = obtener_siguiente_trabajadora_social()
        # crea el expediente inicial y conserva la instancia para generar la notificacion al usuario asignado
        expediente = Expediente.objects.create(
            postulante_titular=postulante,
            estado_expediente=estado_inicial,
            DDJJ=ddjj,
            usuario_asignado=trabajadora_social
        )
        # notifica a la trabajadora social cuando recibe el expediente por primera vez
        crear_notificacion_recepcion_expediente(trabajadora_social, expediente)

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update']:
            return [IsDataEntryOrSuperAdmin()]
        if self.action == 'destroy':
            return [IsSuperAdmin()]
        return [IsAnyRole()]
    

 
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
    queryset = Expediente.objects.all().order_by('-id')[:5]
    serializer_class = ExpedienteSerializer

    def perform_create(self, serializer):
        trabajadora_social = obtener_siguiente_trabajadora_social()
        # Guarda el expediente creado manualmente y conserva la instancia para notificar al usuario asignado.
        expediente = serializer.save(usuario_asignado=trabajadora_social)
        # Notifica a la Trabajadora Social cuando recibe el expediente creado desde este endpoint.
        crear_notificacion_recepcion_expediente(trabajadora_social, expediente)

    def get_queryset(self):
        usuario = self.request.user
        
        buscar = self.request.query_params.get('buscar')
        estado = self.request.query_params.get('estado')
        dni = self.request.query_params.get('dni') 
        dni_inicio = self.request.query_params.get('dni_inicio' ) 
        dni_fin = self.request.query_params.get('dni_fin' ) 
        dni_contiene = self.request.query_params.get('dni_contiene')
           
        usuario_asignado = self.request.query_params.get('usuario_asignado')

        
        if not usuario.is_authenticated:
            queryset = Expediente.objects.all()
        elif hasattr(usuario, 'usuario') and usuario.usuario.rol.nombre_rol == 'TS':
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
        
        if dni_inicio:
            queryset = queryset.filter(postulante_titular__dni__startswith=dni_inicio)

        if dni_fin:
            queryset = queryset.filter(postulante_titular__dni__endswith=dni_fin)

        if dni_contiene:
         queryset = queryset.filter(postulante_titular__dni__contains=dni_contiene)
            
        if usuario_asignado:
            queryset = queryset.filter(usuario_asignado = usuario_asignado)
            
        return queryset   
    
    def get_permissions(self):
        if self.action == 'create':
            return [IsDataEntry()]
        if self.action in ['destroy']:
            return [IsSuperAdmin()]
        return [IsAnyRole()]    

    @action(detail=False, methods=['get'], url_path='reporte-estados')
    def reporte_estados(self, request):
        conteos = (
            Expediente.objects
            .values('estado_expediente__nombre')
            .annotate(cantidad=Count('id'))
        )

        conteos_por_estado = {
            item['estado_expediente__nombre']: item['cantidad']
            for item in conteos
        }

        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="reporte_estados_expedientes.csv"'

        writer = csv.writer(response)
        writer.writerow(['Estado', 'Cantidad'])

        estados = dict(EstadoExpediente.tipo_estado)
        for codigo_estado, nombre_estado in estados.items():
            writer.writerow([nombre_estado, conteos_por_estado.get(codigo_estado, 0)])

        return response
    
    
    @action(detail=True, methods=['patch'], permission_classes=[IsDataEntry])
    def cambiar_estado(self, request, pk=None):
        expediente= self.get_object()
        nuevo_estado = request.data.get('estado')
        
        if nuevo_estado in ['AP', 'NOAP', 'NUEVAV']:
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
    
    @action(detail=False, methods=['get'])
    def auditoria_usuarios(self, request):
        try:
            perfiles = self.get_queryset() 
            resultado = []

            for perfil in perfiles:
                user_nativo = perfil.usuario
                expedientes_del_usuario = user_nativo.expediente_set.all()
                
                total_asignados = expedientes_del_usuario.count()

                desglose_db = expedientes_del_usuario.values('estado_expediente__nombre').annotate(cantidad=Count('id'))

                estados_limpios = {}
                for item in desglose_db:
                    codigo_estado = item['estado_expediente__nombre']
                    clave = codigo_estado if codigo_estado else "Sin estado"
                    estados_limpios[clave] = item['cantidad']

                resultado.append({
                    "usuario_id": perfil.id,
                    "nombre_completo": f"{perfil.apellido}, {perfil.nombre}",
                    "rol": perfil.rol.nombre_rol if perfil.rol else "Sin Rol",
                    "total_asignados": total_asignados,
                    "desglose_estados": estados_limpios
                })
            return Response(resultado)
        
        except Exception as e:
            import traceback
            return Response({"error_fatal": f"Error: {str(e)}",
                "detalle": traceback.format_exc()
            }, status=500)
        
        
class DocumentoAdjuntoViewSet(viewsets.ModelViewSet):
    queryset = DocumentoAdjunto.objects.all()
    permission_classes = [IsAnyRole]
    serializer_class = DocumentoAdjuntoSerializer        


class HistorialPaseViewSet(ListModelMixin, RetrieveModelMixin, CreateModelMixin, GenericViewSet):
    queryset = HistorialPase.objects.all()
    permission_classes = [IsAnyRole]
    serializer_class = HistorialPaseSerializer
    
    def perform_create(self, serializer):
        pase = serializer.save(usuario_origen = self.request.user)
        expediente = pase.expediente
        #Obtiene el perfil del usuario destino para decidir el nuevo estado del expediente segun su rol.
        perfil_destino = getattr(pase.usuario_destino, 'usuario', None)
        
        if expediente.estado_expediente.nombre != 'AP' and perfil_destino:
            rol_destino = perfil_destino.rol.nombre_rol
            
            if rol_destino == 'LG':
                nuevo_estado = EstadoExpediente.objects.get(nombre='LEG')
            else:
                nuevo_estado = EstadoExpediente.objects.get(nombre='1V')
            
            expediente.estado_expediente = nuevo_estado
            # Actualiza el usuario asignado para que el expediente quede en poder de quien lo recibe.
            expediente.usuario_asignado = pase.usuario_destino
            expediente.save()

        # Notifica al usuario destino cuando recibe el expediente por pase.
        # Si ya lo habia recibido antes, el helper usa el mensaje "Caso recibido".
        crear_notificacion_recepcion_expediente(pase.usuario_destino, expediente, pase_actual=pase)
        
    def get_queryset(self):
        queryset = HistorialPase.objects.all()
        expediente_id = self.request.query_params.get('expediente')
        
        if expediente_id:
            queryset = queryset.filter(expediente_id=expediente_id)
            
        return queryset
        
            
class NotificacionViewSet(viewsets.ModelViewSet):
    queryset = Notificacion.objects.all()
    serializer_class = NotificacionSerializer

    # Devuelve solo las notificaciones del usuario autenticado, ordenadas desde la mas reciente.
    def get_queryset(self):
        return Notificacion.objects.filter(
            usuario_destino=self.request.user
        ).order_by('-fecha_creacion')

    def get_permissions(self):
        if self.action == 'create':
            return [IsSuperAdmin()]
        return [IsAnyRole()]

    # Permite que el frontend marque como leida una notificacion ya mostrada al usuario.
    @action(detail=True, methods=['patch'], url_path='marcar-leida')
    def marcar_leida(self, request, pk=None):
        notificacion = self.get_object()
        notificacion.leida = True
        notificacion.save(update_fields=['leida'])
        return Response({'mensaje': 'Notificacion marcada como leida'})

class HistorialAccionViewSet(ListModelMixin, RetrieveModelMixin, GenericViewSet):
    queryset = HistorialAccion.objects.all()
    permission_classes = [IsAnyRole]
    serializer_class = HistorialAccionSerializer
    
class FormularioSocioHabitacionalViewSet(ListModelMixin, RetrieveModelMixin, CreateModelMixin, UpdateModelMixin, GenericViewSet):
    queryset = FormularioSocioHabitacional.objects.all()
    serializer_class = FormularioSocioHabitacionalSerializer
    
    def perform_create(self, serializer):
        formulario = serializer.save()
        expediente = formulario.expediente
        estado_1v = EstadoExpediente.objects.get(nombre='1V')
        expediente.estado_expediente = estado_1v
        expediente.save()
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update']:
            return [IsTrabajadoraSocial()]
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

