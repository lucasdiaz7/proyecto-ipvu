from rest_framework import serializers
from .models import *
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer


class PostulanteTitularSerializer(serializers.ModelSerializer):
    class Meta:
        model = PostulanteTitular
        fields = '__all__'
        read_only_fields = ('fecha_creacion', 'fecha_modificacion')
        
class IntegranteFamiliaSerializer(serializers.ModelSerializer):
    class Meta:
        model = IntegranteFamilia
        fields = '__all__'
        read_only_fields = ('fecha_creacion', 'fecha_modificacion')
        
class EstadoExpedienteSerializer(serializers.ModelSerializer):
    class Meta:
        model = EstadoExpediente
        fields = '__all__'
        read_only_fields = ('tipo_estado','nombre')

class ExpedienteSerializer(serializers.ModelSerializer):
    estado_expediente = EstadoExpedienteSerializer()
    estado_expediente_id = serializers.PrimaryKeyRelatedField(
        queryset=EstadoExpediente.objects.all(),
        source='estado_expediente',
        write_only=True
    )
    class Meta:
        model = Expediente
        fields = '__all__'
        read_only_fields = ('fecha_creacion', 'fecha_modificacion')
        
class RolSerializer(serializers.ModelSerializer):
    class Meta:
        model = Rol
        fields = '__all__'
        read_only_fields = ('tipo_rol','nombre_rol')
        
class UsuarioSerializer(serializers.ModelSerializer):

    class Meta:
        model = Usuario
        fields = '__all__'
        read_only_fields = ['usuario']
        
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
        
class HistorialPaseSerializer(serializers.ModelSerializer):
    class Meta:
        model = HistorialPase
        fields = '__all__'
        read_only_fields = ('fecha_envio',)
        
class NotificacionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notificacion
        fields = '__all__'
        read_only_fields = ('fecha_creacion', 'leida')
        
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
        read_only_fields = ('fecha_dictamen')
        
        
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
