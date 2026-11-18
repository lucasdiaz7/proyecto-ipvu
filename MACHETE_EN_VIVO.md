# MACHETE EN VIVO — "Crear un pase de expediente entre áreas"

Recorrido de UN request real, en 5 paradas. Cada bloque es código copiado tal cual del repo (ruta y líneas arriba de cada uno) y, debajo, lo que se dice en voz alta (~30 s).

**Camino del request:** React (axios + JWT) → `urls.py` → `HistorialPaseViewSet` → permiso → serializer (`validate`) → `perform_create` → ORM → JSON.

**Apertura (10 s):** *"Como el frontend es React, Django funciona como API. El equivalente a los forms es el serializer y el equivalente a login_required son las permission classes. Voy a seguir una petición real: un usuario le pasa un expediente a otra área."*

---

## PARADA 1 — Modelo y relaciones · `api/gestion/models.py`

### 1.a `Expediente` — líneas 55-74

```python
class Expediente(models.Model):
    #fechas
    fecha_creacion =  models.DateTimeField(auto_now_add=True)
    fecha_limite_ts = models.DateTimeField(null=True, blank=True)
    DDJJ = models.CharField(max_length=50, null=True, blank=True, unique=True) 
    visto = models.BooleanField(default=False)
    # ultimo paso del circuito: con la documentacion presentada y el expediente impreso, Mesa de Entrada
    # lo archiva. Se puede desarchivar. Archivado no se puede pasar ni modificar.
    archivado = models.BooleanField(default=False)
    fecha_archivado = models.DateTimeField(null=True, blank=True)
    #FK
    postulante_titular = models.ForeignKey(PostulanteTitular, on_delete=models.CASCADE)
    usuario_asignado = models.ForeignKey(User, on_delete= models.SET_NULL, null=True)
    estado_expediente = models.ForeignKey(EstadoExpediente, on_delete= models.RESTRICT)
    
    def __str__(self):
        return f"Expediente ID: {self.id}"
    
    class Meta:
        ordering = ['-id']
```

**Decir (30 s):**
> "El Expediente tiene tres claves foráneas y cada una tiene su política de borrado a propósito. El postulante es **CASCADE**: sin postulante no tiene sentido el expediente. El usuario asignado es **SET_NULL**: si se da de baja a una trabajadora social, el expediente no se pierde, queda sin asignar y se reasigna. Y el estado es **RESTRICT**: no se puede borrar un estado que está en uso. La DDJJ es `unique`, así que no hay dos expedientes con la misma declaración jurada."

### 1.b `HistorialPase` — líneas 132-148

```python
class HistorialPase(models.Model):
    #FK
    expediente = models.ForeignKey(Expediente, on_delete=models.CASCADE, related_name='historial_pases')
    usuario_origen = models.ForeignKey(User, on_delete=models.RESTRICT, related_name='pases_enviados' )
    usuario_destino = models.ForeignKey(User, on_delete=models.RESTRICT, related_name='pases_recibidos')
    documentos_adjuntos = models.ManyToManyField(DocumentoAdjunto, related_name='historial_pases', blank=True)
    
    observacion = models.TextField(blank=True, null=True)
    
    #fechas
    fecha_envio = models.DateTimeField (auto_now_add=True)

    def __str__(self):
        return f"Exp {self.expediente.id} - De {self.usuario_origen.username} a {self.usuario_destino.username}"

    class Meta:
        ordering = ['-id']
```

**Decir (30 s):**
> "El pase tiene dos claves a `User`, origen y destino, por eso uso `related_name`: `pases_enviados` y `pases_recibidos`. Si no, Django no podría distinguirlas. Ambas son **RESTRICT**: no se puede borrar un usuario que tiene historial. Y los documentos son una **ManyToMany**: un pase puede llevar varios documentos y un mismo documento puede figurar en varios pases."

### 1.c Protección del historial (si preguntan por `PROTECT`) — `DocumentoAdjunto` línea 114 y `HistorialAccion` líneas 178-179

```python
    expediente = models.ForeignKey(Expediente, on_delete=models.PROTECT, related_name='documentos', null=True, blank=True)
```
```python
    id_usuario_accion=models.ForeignKey("Usuario",on_delete=models.PROTECT)
    id_expediente=models.ForeignKey(Expediente,on_delete=models.PROTECT, null=True, blank=True)
```

**Decir (20 s):**
> "Los documentos y la auditoría usan **PROTECT**: si intento borrar un expediente que tiene documentos, Django lanza `ProtectedError` y lo bloquea. Por eso los documentos no se borran: se anulan con un motivo. El historial no se puede perder."

### 1.d `@property estado` de `FormularioSocioHabitacional` — líneas 211-240

```python
    # Lista centralizada de campos que se usan para calcular automaticamente el estado del formulario.
    CAMPOS_DE_ESTADO = [
        'grupo_familiar',
        'situacion_habitacional',
        'aspecto_economico',
        'situacion_salud',
        'nivel_estudios',
        'relevamiento_vecinal',
        'observaciones',
    ]

    @property
    def estado(self):
        # Calcula cuantos campos tienen contenido real, ignorando espacios en blanco.
        campos_completados = sum(
            1
            for campo in self.CAMPOS_DE_ESTADO
            if str(getattr(self, campo, '') or '').strip()
        )

        # Si no hay ningun campo cargado, el formulario todavia no fue iniciado.
        if campos_completados == 0:
            return 'sin iniciar'

        # Si todos los campos estan cargados, el formulario esta completo.
        if campos_completados == len(self.CAMPOS_DE_ESTADO):
            return 'completado'

        # Si tiene al menos un campo cargado pero no todos, sigue en progreso.
        return 'en progreso'
```

**Decir (30 s):**
> "Acá hay lógica de negocio dentro del modelo. `estado` es una `@property`: no se guarda en la base, se calcula cada vez contando cuántos de los siete campos tienen contenido real. Cero campos es 'sin iniciar', todos es 'completado' y el resto es 'en progreso'. Así el estado nunca queda desactualizado respecto de los datos."

---

## PARADA 2 — Enrutamiento · `api/gestion/urls.py`

### Líneas 9-23 (router) y 25-42 (rutas manuales)

```python
router = DefaultRouter()

router.register(r'postulantetitular', PostulanteTitularViewSet)
router.register(r'estadoexpediente', EstadoExpedienteViewSet)
router.register(r'expediente', ExpedienteViewSet, basename='expediente')
router.register(r'rol', RolViewSet)
router.register(r'usuario', UsuarioViewSet)
router.register(r'documentoadjunto', DocumentoAdjuntoViewSet)   
router.register(r'historialpase', HistorialPaseViewSet)
router.register(r'notificacion', NotificacionViewSet) 
router.register(r'historialaccion', HistorialAccionViewSet)
router.register(r'formulario', FormularioSocioHabitacionalViewSet)

urlpatterns = [
    path('api/', include(router.urls)),

    # rutas de login
    path('api/login/', MiLoginPersonalizadoView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', MiTokenRefreshView.as_view(), name='token_refresh'),
    
    # ruta para establecer contraseña inicial
    path(
        'api/establecer-password-inicial/',
        EstablecerPasswordInicialView.as_view(),
        name='establecer_password_inicial'
    ),

    # rutas para restablecer contraseña en caso de olvidarla
    path('api/password-reset/solicitar/', SolicitarResetPasswordView.as_view(), name='password_reset_solicitar'),
    path('api/password-reset/confirmar/', ConfirmarResetPasswordView.as_view(), name='password_reset_confirmar'),

    # precarga del formulario de nuevo expediente con los datos que extrae el microservicio de IA
    path('api/procesar-documento/', ProcesarDocumentoView.as_view(), name='procesar_documento'),
]
```

**Decir (30 s):**
> "Uso un `DefaultRouter` de DRF: con cada `register` me genera solo las rutas del CRUD. Nuestro request va a `POST /api/historialpase/`. Además agregué a mano las rutas que no son CRUD: el login, el refresh del token, el reseteo de contraseña y `procesar-documento`, que precarga el formulario con los datos que extrae el microservicio de IA. Usé clases (ViewSets) y no funciones porque el router arma las rutas y los permisos se definen una vez por recurso. No usé `app_name` porque hay una sola app y un router."

---

## PARADA 3 — Seguridad y permisos · `api/gestion/permissions.py`

### 3.a `usuario_tiene_rol` — líneas 4-16

```python
def usuario_tiene_rol(request, roles):
    usuario = request.user

    # la contrasena inicial es el DNI: hasta cambiarla, el usuario solo puede usar establecer-password-inicial.
    # un usuario dado de baja (activo=False) no puede hacer nada, aunque todavia tenga un token vigente
    return bool(
        usuario
        and usuario.is_authenticated
        and hasattr(usuario, 'usuario')
        and usuario.usuario.activo
        and not usuario.usuario.requiere_cambio_password
        and usuario.usuario.rol.nombre_rol in roles
    )
```

### 3.b `IsTrabajadoraSocial` e `IsAnyRole` — líneas 31-37

```python
class IsTrabajadoraSocial(BasePermission):
    def has_permission(self, request, view):
        return usuario_tiene_rol(request, ['TS'])

class IsAnyRole(BasePermission):
    def has_permission(self, request, view):
        return usuario_tiene_rol(request, ['TS', 'SU', 'LG', 'DE'])
```

**Decir (30 s):**
> "Hay una función base y una clase de permiso por rol. `usuario_tiene_rol` exige cinco cosas: que esté autenticado, que tenga perfil, que esté **activo**, que ya haya **cambiado la contraseña inicial** y que su rol esté permitido. Así un usuario dado de baja no puede hacer nada aunque tenga un token vigente. Las clases como `IsTrabajadoraSocial` solo declaran qué roles aplican. Nuestro `HistorialPaseViewSet` usa `IsAnyRole`: cualquiera de los cuatro roles puede pasar un expediente, pero después se valida que lo tenga en su poder. Por defecto todo está cerrado: `DEFAULT_PERMISSION_CLASSES` es `IsAuthenticated`."

---

## PARADA 4 — Validación · `api/gestion/serializers.py`

### 4.a `validate_archivo` — líneas 265-274 (constantes en líneas 17-18)

```python
EXTENSIONES_ADJUNTO = ('.pdf', '.png', '.jpg', '.jpeg')
TAMANIO_MAXIMO_ADJUNTO_MB = 10
```
```python
    def validate_archivo(self, archivo):
        if archivo is None:
            return archivo
        if not archivo.name.lower().endswith(EXTENSIONES_ADJUNTO):
            raise serializers.ValidationError(
                f"Formato no soportado. Formatos válidos: {', '.join(EXTENSIONES_ADJUNTO)}"
            )
        if archivo.size > TAMANIO_MAXIMO_ADJUNTO_MB * 1024 * 1024:
            raise serializers.ValidationError(f"El archivo supera los {TAMANIO_MAXIMO_ADJUNTO_MB} MB permitidos.")
        return archivo
```

**Decir (30 s):**
> "Esto cumple el mismo rol que un `clean_<campo>` de un Form. Valida el campo `archivo`: solo acepta PDF o imágenes y un máximo de 10 MB. Si algo está mal, lanza `ValidationError`, que DRF convierte en una respuesta 400 con un JSON `{campo: mensaje}`, y React lo muestra en un toast."

### 4.b `HistorialPaseSerializer.validate` — líneas 305-316

```python
    def validate(self, attrs):
        attrs = super().validate(attrs)
        expediente = attrs.get('expediente') or getattr(self.instance, 'expediente', None)
        documentos = attrs.get('documentos_adjuntos', [])

        for doc in documentos:
            if doc.expediente_id != expediente.id:
                raise serializers.ValidationError({
                    'documentos_adjuntos': f'El documento {doc.id} no pertenece al expediente del pase.'
                })
                
        return attrs
```

**Decir (30 s):**
> "Esta es una validación a nivel objeto, que cruza dos campos. Verifica que cada documento que viaja en el pase pertenezca al expediente que se está pasando. Sin esto, alguien podría mandar un id de documento de otro expediente. Valido en el serializer y no en el modelo porque es la frontera de entrada de la API; el modelo no tiene `clean()`."

---

## PARADA 5 — Vista y lógica de negocio · `api/gestion/views.py`

### 5.a `HistorialPaseViewSet.perform_create` — líneas 1171-1219

```python
class HistorialPaseViewSet(ListModelMixin, RetrieveModelMixin, CreateModelMixin, GenericViewSet):
    queryset = HistorialPase.objects.all()
    permission_classes = [IsAnyRole]
    serializer_class = HistorialPaseSerializer
    
    def perform_create(self, serializer):
        # solo quien tiene el expediente en su poder lo puede pasar
        validar_expediente_en_poder(self.request, serializer.validated_data.get('expediente'))
        destino = serializer.validated_data.get('usuario_destino')
        perfil_destino = getattr(destino, 'usuario', None) if destino else None
        if destino and (not destino.is_active or (perfil_destino and not perfil_destino.activo)):
            raise ValidationError({'usuario_destino': 'Ese usuario está inactivo: elegí otro.'})
        pase = serializer.save(usuario_origen = self.request.user)
        expediente = pase.expediente

        documentos_pendientes = DocumentoAdjunto.objects.filter(
            expediente=expediente,
            historial_pases__isnull=True
        )
        if documentos_pendientes.exists():
            pase.documentos_adjuntos.add(*list(documentos_pendientes))
            serializer.instance = HistorialPase.objects.prefetch_related('documentos_adjuntos').get(id=pase.id)
        
        if pase.usuario_destino:
            expediente.usuario_asignado = pase.usuario_destino
            # cuando el expediente llega a un usuario de Legales pasa al estado "Legales"
            perfil_destino = getattr(pase.usuario_destino, 'usuario', None)
            if perfil_destino and perfil_destino.rol.nombre_rol == 'LG':
                estado_anterior = expediente.estado_expediente
                expediente.estado_expediente, _ = EstadoExpediente.objects.get_or_create(nombre='LEG')
                if estado_anterior != expediente.estado_expediente:
                    registrar_auditoria(
                        self.request.user, expediente,
                        f"Cambio de estado: de {estado_anterior} a {expediente.estado_expediente} (pase a Legales)."
                    )
            elif getattr(expediente.estado_expediente, 'nombre', None) == 'LEG':
                # sale de Legales (ya hay dictamen): vuelve al estado que tenia antes de entrar
                estado_previo = _estado_antes_de_legales(expediente)
                if estado_previo is not None:
                    registrar_auditoria(
                        self.request.user, expediente,
                        f"Cambio de estado: de {expediente.estado_expediente} a {estado_previo} (vuelve de Legales)."
                    )
                    expediente.estado_expediente = estado_previo
            expediente.save()

        # Notifica al usuario destino cuando recibe el expediente por pase.
        # Si ya lo habia recibido antes, el helper usa el mensaje "Caso recibido".
        crear_notificacion_recepcion_expediente(pase.usuario_destino, expediente, pase_actual=pase)
```

Helper que usa la primera línea (`views.py` líneas 297-307):

```python
def expediente_en_poder(request, expediente):
    return expediente is not None and expediente.usuario_asignado_id == request.user.id


def validar_expediente_en_poder(request, expediente):
    if expediente is None:
        return
    if not expediente_en_poder(request, expediente):
        raise PermissionDenied('El expediente no está en tu poder: pedí que te lo pasen.')
    if expediente.archivado:
        raise PermissionDenied('El expediente está archivado: desarchivalo para modificarlo.')
```

**Decir (30 s) — es el ejemplo central, ir despacio:**
> "Acá está la lógica de negocio. `perform_create` se ejecuta después de que el serializer validó. Primero verifica que quien envía **tenga el expediente en su poder** y que no esté archivado. Después verifica que el destinatario esté activo. Guarda el pase con `usuario_origen` igual al usuario logueado: el cliente no puede falsificar quién envía. Adjunta automáticamente los documentos que todavía no viajaron en ningún pase. Cambia el usuario asignado y, si el destino es de **Legales**, el expediente pasa al estado Legales. Si sale de Legales, vuelve al estado anterior. Cada cambio de estado queda en la auditoría. Y al final crea la notificación para el destinatario."

### 5.b `obtener_siguiente_trabajadora_social` — líneas 401-446

```python
#Algoritmo de asignacion de trabajadoras sociales para la creacion de expedientes
def obtener_siguiente_trabajadora_social():
    # 1. Solo se consideran las trabajadoras sociales que están activas
    trabajadoras = list(
        User.objects
        .filter(usuario__rol__nombre_rol="TS", usuario__activo=True)
        .order_by("id")
    )

    if not trabajadoras:
        return None

    # 2. Se busca el último expediente asignado a una TS para continuar
    # el turno desde la trabajadora siguiente (rotación round-robin)
    ultimo_expediente = (
        Expediente.objects
        .filter(usuario_asignado__usuario__rol__nombre_rol="TS")
        .order_by("-id")
        .first()
    )

    if not ultimo_expediente or not ultimo_expediente.usuario_asignado:
        return trabajadoras[0]

    ultimo_usuario = ultimo_expediente.usuario_asignado

    # 3. Si el último usuario se dio de baja y ya no está en la lista de activas,
    # index() lanza ValueError y se resuelve en el bloque except
    try:
        indice_actual = trabajadoras.index(ultimo_usuario)
        siguiente_indice = indice_actual + 1
        
        if siguiente_indice >= len(trabajadoras):
            siguiente_indice = 0
            
        return trabajadoras[siguiente_indice]
        
    except ValueError:
        # Si el último usuario se dio de baja, buscamos a la siguiente TS 
        # que tenga un ID mayor al que se fue.
        siguientes = [t for t in trabajadoras if t.id > ultimo_usuario.id]
        
        if siguientes:
            return siguientes[0] # Le toca al próximo en la fila
        else:
            return trabajadoras[0] # Si el que se fue era el último, volvemos a empezar
```

**Decir (30 s):**
> "Este es el algoritmo de asignación automática, round-robin. Trae las trabajadoras sociales **activas** ordenadas por id con el ORM: `filter` atravesando relaciones con doble guion bajo. Busca el último expediente asignado a una TS y le da el siguiente a la que sigue en la lista; si era la última, vuelve a la primera. Si esa trabajadora se dio de baja y ya no está en la lista, el `index` lanza `ValueError` y se resuelve en el `except`: se elige la siguiente con id mayor. Así el reparto es parejo y no se rompe con las bajas."

---

## Cierre (10 s)

> "Resumiendo el camino: React manda el request con el JWT, el router lo deriva al ViewSet, el permiso valida el rol, el serializer valida los datos, `perform_create` aplica las reglas de negocio, el ORM guarda y devolvemos JSON."

---

## Si preguntan (respuestas de 1 línea)

- **¿Por qué no hay templates?** "Porque el frontend es React; Django solo devuelve JSON."
- **¿Y el CSRF?** "Usamos JWT en el header `Authorization`, que el navegador no manda solo, así que no hay CSRF que explotar."
- **¿Por qué una sola app?** "Es un único dominio muy acoplado. Si crece, la separaríamos en usuarios, expedientes y notificaciones."
- **¿Qué mejorarían?** "`views.py` es muy largo: lo separaría en un paquete `views/` y pasaría la lógica a un módulo de servicios. Y agregaría validaciones con `clean()` en los modelos."
- **¿Qué pasa si borro un postulante?** "Se borran sus expedientes por CASCADE, pero si tienen documentos Django lo bloquea por el PROTECT."

## Antes de entrar

- Los números de línea son del estado actual del repo. Si se edita alguno de estos archivos, hay que revisarlos.
- Abrir en el editor: `models.py`, `urls.py`, `permissions.py`, `serializers.py`, `views.py`.
- Tener probadas las credenciales de cada rol y el video de respaldo de la IA.
