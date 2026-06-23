from rest_framework import serializers
from .models import *
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.models import User
from django.utils.http import urlsafe_base64_decode
from django.utils.encoding import force_str
from django.contrib.auth.tokens import default_token_generator
from django.utils import timezone


class PostulanteTitularSerializer(serializers.ModelSerializer):
    ddjj= serializers.CharField(write_only = True)
    
    class Meta:
        model = PostulanteTitular
        fields = '__all__'
        read_only_fields = ('fecha_creacion', 'fecha_modificacion')
        

        
class EstadoExpedienteSerializer(serializers.ModelSerializer):
    class Meta:
        model = EstadoExpediente
        fields = ['id', 'nombre']
        read_only_fields = ('nombre',)

class ExpedienteSerializer(serializers.ModelSerializer):
    estado_expediente = EstadoExpedienteSerializer(read_only= True)
    estado_expediente_id = serializers.PrimaryKeyRelatedField(
        queryset=EstadoExpediente.objects.all(),
        source='estado_expediente',
        write_only=True
    )
    
    class Meta:
        model = Expediente
        fields = '__all__'
        read_only_fields = ('fecha_creacion', 'fecha_modificacion')
        
    def to_representation(self, instance):
        response = super().to_representation(instance)
        
        ultimo_pase = instance.historial_pases.order_by('-fecha_envio').first()
        fecha_referencia = None

        if ultimo_pase and ultimo_pase.fecha_envio:
            fecha_referencia = ultimo_pase.fecha_envio
        elif instance.fecha_creacion:
            fecha_referencia = instance.fecha_creacion

        if fecha_referencia:
            diferencia = timezone.now() - fecha_referencia
            response['dias_en_poder'] = diferencia.days
        else:
            response['dias_en_poder'] = 0
        if instance.postulante_titular:
            response['postulante_titular'] = {
                'id': instance.postulante_titular.id,
                'apellido': instance.postulante_titular.apellido,
                'nombre': instance.postulante_titular.nombre,  
                'dni': instance.postulante_titular.dni
            }

        if instance.usuario_asignado:
            response['usuario_asignado'] = {
                'id': instance.usuario_asignado.id,
                'apellido': instance.usuario_asignado.last_name,
                'nombre': instance.usuario_asignado.first_name 
            }

        return response
    
    
class RolSerializer(serializers.ModelSerializer):
    class Meta:
        model = Rol
        fields = '__all__'
        read_only_fields = ('tipo_rol','nombre_rol')
        
class UsuarioSerializer(serializers.ModelSerializer):

    class Meta:
        model = Usuario
        fields = '__all__'
        read_only_fields = ('usuario',)
        
    def create(self, validated_data):
        dni_ingresado = validated_data.get('dni')
        email_ingresado= validated_data.get('email')
        
        nuevo_usuario= User.objects.create_user (
            username = dni_ingresado,
            password = dni_ingresado,
            email=email_ingresado
        )
    
        perfil_usuario = Usuario.objects.create(usuario=nuevo_usuario, **validated_data)
        
        return perfil_usuario
        
    def to_representation(self, instance):
        ret = super().to_representation(instance)
    
        if instance.usuario:
            ret['username_display'] = instance.usuario.username
        
        if instance.rol:
            ret['rol_display'] = instance.rol.nombre_rol
    
        return ret
    
class DocumentoAdjuntoSerializer(serializers.ModelSerializer):
   class Meta:
        model = DocumentoAdjunto
        fields = '__all__'


class DocumentoExpedienteSerializer(serializers.ModelSerializer):
   class Meta:
        model = DocumentoExpediente
        fields = '__all__'

class HistorialPaseSerializer(serializers.ModelSerializer):
    expediente_info = serializers.SerializerMethodField()

    class Meta:
        model = HistorialPase
        fields = [
            'id',
            'expediente',
            'expediente_info',
            'usuario_origen',
            'usuario_destino',
            'observacion',
            'fecha_envio',
        ]
        read_only_fields = ('fecha_envio', 'usuario_origen', 'expediente_info')

    def get_expediente_info(self, obj):
        expediente = obj.expediente

        return {
            'id': expediente.id,
            'ddjj': expediente.DDJJ,
            'usuario_asignado': {
                'id': expediente.usuario_asignado.id,
                'nombre': expediente.usuario_asignado.first_name,
                'apellido': expediente.usuario_asignado.last_name,
            } if expediente.usuario_asignado else None,
            'postulante_titular': {
                'id': expediente.postulante_titular.id,
                'nombre': expediente.postulante_titular.nombre,
                'apellido': expediente.postulante_titular.apellido,
                'dni': expediente.postulante_titular.dni,
            } if expediente.postulante_titular else None
        }
        
class NotificacionSerializer(serializers.ModelSerializer):
    # agrega datos resumidos del expediente para mostrar la notificacion sin pedir otro endpoint
    expediente = serializers.SerializerMethodField()

    class Meta:
        model = Notificacion
        fields = [
            'id',
            'mensaje',
            'fecha_creacion',
            'leida',
            'usuario_destino',
            'expediente_relacionado',
            'expediente',
        ]
        read_only_fields = ('fecha_creacion', 'leida', 'expediente')

    # version compacta del expediente relacionado para que el frontend pueda listar el caso recibido
    def get_expediente(self, obj):
        if not obj.expediente_relacionado:
            return None

        expediente = obj.expediente_relacionado
        postulante = expediente.postulante_titular

        return {
            'id': expediente.id,
            'ddjj': expediente.DDJJ,
            'estado': expediente.estado_expediente.nombre,
            'postulante': {
                'id': postulante.id,
                'nombre': postulante.nombre,
                'apellido': postulante.apellido,
                'dni': postulante.dni,
            }
        }
        
class HistorialAccionSerializer(serializers.ModelSerializer):
    class Meta:
        model = HistorialAccion
        fields = '__all__'
        read_only_fields = ('fecha_accion',)
        
class FormularioSocioHabitacionalSerializer(serializers.ModelSerializer):
    class Meta:
        model = FormularioSocioHabitacional
        fields = '__all__'
        read_only_fields = ('fecha_creacion', 'fecha_modificacion')
        
class DictamenLegalSerializer(serializers.ModelSerializer):
    class Meta:
        model = DictamenLegal
        fields = '__all__'
        read_only_fields = ('fecha_dictamen',)
                
class MiLoginPersonalizadoSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        
        try:
            perfil_ipvu = Usuario.objects.get(usuario=self.user)
            
            data['nombre_completo'] = f"{perfil_ipvu.nombre} {perfil_ipvu.apellido}"
            data['rol_id'] = perfil_ipvu.rol.id
            data['requiere_cambio_password'] = perfil_ipvu.requiere_cambio_password
            
        except Usuario.DoesNotExist:
            pass
            
        return data

class EstablecerPasswordInicialSerializer(serializers.Serializer):
    nueva_password = serializers.CharField(write_only=True)
    confirmar_password = serializers.CharField(write_only=True)
    
    #attrs es diccionario de django que contiene los datos de entrada validados 
    #que vinieron del request
    def validate(self, attrs):
        usuario=self.context["request"].user
        perfil = usuario.usuario

        if not perfil.requiere_cambio_password:
            raise serializers.ValidationError("El usuario no requiere cambio " \
            "de contraseña")
        
        if attrs["nueva_password"] != attrs["confirmar_password"]:
            raise serializers.ValidationError("Las contraseñas no coinciden")
        
        validate_password(attrs["nueva_password"], user=usuario)

        return attrs
    
    

     # **kwargs indica cualquier argumento extra
     
    def save(self, **kwargs):
        usuario = self.context["request"].user
        perfil = usuario.usuario

        usuario.set_password(self.validated_data["nueva_password"])
        usuario.save()

        perfil.requiere_cambio_password = False
        perfil.save(update_fields=["requiere_cambio_password"])

        return usuario
    
# serializador para reset de password en caso de olvidarla

class SolicitarResetPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()


class ConfirmarResetPasswordSerializer(serializers.Serializer): 
    uid = serializers.CharField()
    token = serializers.CharField()
    nueva_password = serializers.CharField(write_only=True)
    confirmar_password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        try:
            uid = force_str(urlsafe_base64_decode(attrs['uid']))
            usuario = User.objects.get(pk=uid)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            raise serializers.ValidationError("El link de reset no es válido")

        if not default_token_generator.check_token(usuario, attrs['token']):
            raise serializers.ValidationError("El link de reset no es válido o ha expirado")

        if attrs ['nueva_password'] != attrs['confirmar_password']:
            raise serializers.ValidationError("Las contraseñas no coinciden")

        validate_password(attrs["nueva_password"], user=usuario)
        attrs['usuario'] = usuario


        return attrs 
    
    def save(self, **kwargs):
        usuario = self.validated_data['usuario']
        
        usuario.set_password(self.validated_data["nueva_password"])
        usuario.save()

        if hasattr(usuario, "usuario"):
            perfil = usuario.usuario
            perfil.requiere_cambio_password = False
            perfil.save(update_fields=["requiere_cambio_password"])

        return usuario



