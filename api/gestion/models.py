from django.db import models
from django.contrib.auth.models import User

# Create your models here.
class PostulanteTitular(models.Model):
    nombre = models.CharField (max_length=40)
    apellido = models.CharField (max_length=40)
    telefono = models.CharField (max_length=15)
    dni = models.CharField (max_length=15, unique=True)
    domicilio_actual = models.CharField (max_length=200)
    email = models.EmailField(null=True, blank=True)
    
    #fechas
    fecha_creacion = models.DateTimeField (auto_now_add=True)
    fecha_modificacion = models.DateTimeField (auto_now=True)
    
    def __str__(self):
        return f"{self.nombre} {self.apellido} - DNI: {self.dni}"


#borrar este modelo
class IntegranteFamilia(models.Model): 
    dni = models.CharField(max_length=20)
    nombre = models.CharField(max_length=50)
    apellido = models.CharField(max_length=50)
    parentesco = models.CharField(max_length=50)
    
    #fechas
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_modificacion = models.DateTimeField(auto_now_add=True)
    
    #FK
    postulante_titular = models.ForeignKey(PostulanteTitular, on_delete=models.CASCADE, related_name='integrantes')

class EstadoExpediente(models.Model):
    tipo_estado = [
        ('SINI', 'Sin Iniciar'),
        ('1V', '1ra Visita'),
        ('LEG', 'Legales'),
        ('DOCP', 'Doc Presentada'),
        ('AP', 'Apto'),
        ('NOAP', 'No Apto'),
        ('NUEVAV', 'Nueva Visita'),
    ]
    
    nombre = models.CharField(max_length=10, choices=tipo_estado, unique=True)
    
    def __str__(self):
        # Magia de Django: get_FOO_display() muestra el texto legible ("Apto") y no el código ("AP")
        return self.get_nombre_display()
    
    @property
    def color(self):
        # Asociamos cada código con un color (Ideales para usar con Bootstrap o CSS en el HTML que te dio Claude)
        colores = {
            'SINI': 'gray',       # Sin Iniciar -> Gris
            '1V': 'blue',       # 1ra Visita -> Azul
            'LEG': 'purple',     # Legales -> Morado
            'DOCP': 'teal',       # Doc Presentada -> Turquesa
            'AP': 'green',      # Apto -> Verde
            'NOAP': 'red',        # No Apto -> Rojo
            'NUEVAV': 'orange',     # Nueva Visita -> Naranja
            }
    
    
class Expediente(models.Model):
    #fechas
    fecha_creacion =  models.DateTimeField(auto_now_add=True)
    fecha_limite_ts = models.DateTimeField(null=True, blank=True)
    DDJJ = models.CharField(max_length=50, null=True, blank=True, unique=True) 
    visto = models.BooleanField(default=False)
    #FK
    postulante_titular = models.ForeignKey(PostulanteTitular, on_delete=models.CASCADE)
    usuario_asignado = models.ForeignKey(User, on_delete= models.SET_NULL, null=True)
    estado_expediente = models.ForeignKey(EstadoExpediente, on_delete= models.RESTRICT)
    
    def __str__(self):
        return f"Expediente ID: {self.id}"
    
    class Meta:
        ordering = ['-id']


    
class Rol(models.Model):
     #django exige dos opciones, una abreviación y un string legible
     tipo_rol = [('TS','TRABAJADORA SOCIAL'),
        ('SU', 'SUPERUSUARIO'),
        ('LG','LEGALES'),
        ('DE','DATA ENTRY'),]
     descripcion = models.CharField(max_length=100)

     nombre_rol = models.CharField(max_length=2, choices=tipo_rol)
     #para que al seleccionar un rol se muestre el nombre del rol
     def __str__(self):
        return self.get_nombre_rol_display()

class Usuario(models.Model):
    usuario = models.OneToOneField(User, on_delete=models.CASCADE)
    nombre = models.CharField(max_length=50,)
    apellido = models.CharField(max_length=50,)
    matricula = models.CharField(max_length=20, unique=True,)
    dni = models.CharField(max_length=15)
    email= models.EmailField(unique=True, null=True, blank=True)
    
    #FK
    rol = models.ForeignKey(Rol, on_delete=models.RESTRICT)

    requiere_cambio_password  = models.BooleanField(default=True)
    
    def __str__(self):
        return f"Perfil de: {self.usuario.username} {self.usuario.last_name} - DNI: {self.dni}"


class DocumentoAdjunto(models.Model):
    tipo_documento = models.CharField(max_length=200)

    #FK
    id_expediente = models.ForeignKey(Expediente, on_delete= models.PROTECT)

    def __str__(self):
        return f"ID Documento: {self.id}"


    
class HistorialPase(models.Model):
    #FK
    expediente = models.ForeignKey(Expediente, on_delete=models.CASCADE, related_name='historial_pases')
    usuario_origen = models.ForeignKey(User, on_delete=models.RESTRICT, related_name='pases_enviados' )
    usuario_destino = models.ForeignKey(User, on_delete=models.RESTRICT, related_name='pases_recibidos')
    
    observacion = models.TextField(blank=True, null=True)
    
    #fechas
    fecha_envio = models.DateTimeField (auto_now_add=True)

    def __str__(self):
        return f"Exp {self.expediente.id} - De {self.usuario_origen.username} a {self.usuario_destino.username}"

    class Meta:
        ordering = ['-id']

class Notificacion(models.Model):
    mensaje = models.CharField(max_length=200)
    
    #fecha
    fecha_creacion = models.DateTimeField (auto_now_add=True)
     
    leida = models.BooleanField (default=False)
    
    #FK
    usuario_destimo = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notificaciones_recibidas')
    expediente_relacionado = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    
    def __str__(self):
        return f"Notificación para {self.usuario_destino.username}"


class HistorialAccion(models.Model):
    mensaje_accion=models.CharField(max_length=300)

    #fecha
    fecha_accion=models.DateTimeField(auto_now_add=True)

    #fk
    id_usuario_accion=models.ForeignKey("Usuario",on_delete=models.PROTECT)
    id_expediente=models.ForeignKey(Expediente,on_delete=models.PROTECT)

    def __str__(self):
        return f"ID Accion: {self.id}, mensaje: {self.mensaje_accion}"
    
    
class FormularioSocioHabitacional(models.Model): 
    grupo_familiar=models.TextField()
    situacion_habitacional=models.TextField()
    aspecto_economico=models.TextField()
    situacion_salud=models.TextField()
    nivel_estudios=models.CharField(max_length=100)
    relevamiento_vecinal=models.TextField()
    observaciones=models.TextField()
    

    #FK
    expediente = models.ForeignKey(Expediente, on_delete=models.CASCADE)
    #fechas
    fecha_creacion=models.DateTimeField(auto_now_add=True)
    fecha_modificacion=models.DateTimeField(auto_now=True)

    def __str__(self):
      return (
        f"Grupo Familiar: {self.grupo_familiar},\n "
        f"Situacion Habitacional: {self.situacion_habitacional}, \n"
        f"Aspecto Economico: {self.aspecto_economico},\n "
        f"Situacion Salud: {self.situacion_salud}, \n  "
        f"Nivel Estudios: {self.nivel_estudios},\n "
        f"Relevamiento Vecinal: {self.relevamiento_vecinal},\n "
        f"Observaciones: {self.observaciones}"
    )

class DictamenLegal(models.Model):
    texto_observaciones=models.TextField()

    # opciones de estado (sujeto a cambio), el virgo de django quiere si o si q le tires dos alternativas de escritura para la misma
    # opcion, por eso se repiten
    estado_sancion= models.CharField(max_length=35, choices=[("APTO", "APTO"), ("NO APTO", "NO APTO"), ("EN REVISION", "EN REVISION")])

    #fecha
    fecha_dictamen=models.DateTimeField(auto_now_add=True)

    #FK 
    id_usuario=models.ForeignKey(Usuario, on_delete=models.PROTECT)
    id_expediente=models.ForeignKey(Expediente, on_delete=models.PROTECT, null=True, blank=True)
    
    def __str__(self):
       return f"Observaciones: {self.texto_observaciones}. Estado: {self.estado_sancion}. Fecha {self.fecha_dictamen}"


    
