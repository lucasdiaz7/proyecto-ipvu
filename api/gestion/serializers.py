from rest_framework import serializers
from .models import *

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
        read_only_fields = ('usuario','dni')
        
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
        read_only_fields = ('fecha_dictamen', 'estado_sancion')