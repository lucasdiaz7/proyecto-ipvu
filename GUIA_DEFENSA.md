# Guía para la defensa — Programación IV (Django)

Basada en el PDF de la profesora, en la transcripción del audio y en el código real del repo.
Regla de la profesora: *"No van a describir lo que no han hecho, sino lo que han hecho."*

## 0. Lo primero: qué es nuestro proyecto (y qué no)

Es **Django + Django REST Framework (API JSON) + React**. Eso cambia cómo se contesta cada eje:

| Pide la pauta | En nuestro proyecto |
|---|---|
| MVT (Modelo-Vista-Plantilla) | **Modelo** = `models.py`. **Vista** = ViewSets de DRF. **Plantilla** = no hay: la capa de presentación es React, y Django devuelve JSON. La profesora dijo que con React *no aplica* el tema de plantillas. |
| `forms.py` / `clean_<campo>` | Usamos **serializers** (`serializers.py`) con `validate()` y `validate_<campo>()`. Cumplen el mismo rol que un Form. |
| `{% csrf_token %}` | No lo usamos: autenticamos con **JWT en el header `Authorization`**, no con cookies de sesión, así que no hay CSRF que explotar. `CsrfViewMiddleware` sigue activo (lo usa el `/admin/`). |
| `django.contrib.messages` | No lo usamos para feedback. Los errores salen como **respuesta 400 con JSON** y React los muestra con toasts ([ToastContext.jsx](client/src/context/ToastContext.jsx)). |
| `@login_required` / mixins | `DEFAULT_PERMISSION_CLASSES = IsAuthenticated` + clases de permiso por rol en [permissions.py](api/gestion/permissions.py). |

Frase útil: *"Como el frontend es React, Django funciona como API; el equivalente a forms es el serializer y el equivalente a login_required son las permission classes."*

## 1. Guion (20–25 min)

1. **Problema y usuarios (3 min).** IPVU: seguimiento de expedientes de postulantes a vivienda. Antes: circulaban en papel. Ahora: carga, asignación automática a una Trabajadora Social, pases entre áreas, estados, auditoría, archivo, PDF del expediente completo. Roles: Data Entry (DE), Trabajadora Social (TS), Legales (LG), Superusuario (SU).
2. **Arquitectura y modelos (4 min).** Mostrar [models.py](api/gestion/models.py) y el diagrama de relaciones (sección 3-A).
3. **Demo en vivo (6 min).** Recorrido: DE carga un expediente (con precarga por IA) → se asigna solo a una TS y le llega notificación → TS completa el formulario socio-habitacional y ve el semáforo de inconsistencias → pase a Legales (cambia a estado "Legales") → vuelve → impresión/archivo → SU ve auditoría, usuarios y exportar. Mostrar que cada rol ve cosas distintas.
4. **Código backend (7 min).** Seguir un request: React → `urls.py` → ViewSet → permission → serializer (validación) → ORM → respuesta JSON. Ejemplo ideal: **crear un pase** (`HistorialPaseViewSet.perform_create`).
5. **Preguntas (el resto).**

## 2. Requisitos del día

- Entorno virtual activado, `runserver` corriendo, React corriendo, editor abierto.
- Credenciales de **cada rol** anotadas y **probadas** (admin, DE, TS, LG).
- Datos coherentes: nada de "test", "asdf", "prueba 1", "admin123". Revisar [cargar_datos_prueba.py](api/gestion/management/commands/cargar_datos_prueba.py) y la base real. (Ojo: existe `pruebas-20.py`; no mostrarlo.)
- **Plan de contingencia:** usamos Supabase/PostgreSQL y el microservicio de IA (ver [ia_client.py](api/gestion/ia_client.py)). Sin internet puede fallar → **grabar un video corto** de la precarga de la DDJJ con IA y de la conexión a la base.
- Hablar con vocabulario técnico: *ORM, queryset, serializer, ViewSet, migración*; no "SQL/MySQL" (usamos PostgreSQL a través del ORM por `DATABASE_URL`).

## 3. Los cinco ejes, con lo que realmente hay

### A. Modelos ([models.py](api/gestion/models.py))

- **Una sola app: `gestion`.** Si preguntan por qué: todo el dominio (expedientes, usuarios, pases, notificaciones) está fuertemente acoplado y es un único contexto de negocio. Admitir que se podría separar en `usuarios`, `expedientes`, `notificaciones`. Mejor decirlo vos antes de que lo pregunten.
- **Relaciones y `on_delete`** (acá es donde más van a insistir, estudiarlo):
  - `Expediente.postulante_titular` → FK, **CASCADE** (sin postulante no tiene sentido el expediente).
  - `Expediente.usuario_asignado` → FK, **SET_NULL** (si se borra el usuario, el expediente no se pierde).
  - `Expediente.estado_expediente` → FK, **RESTRICT** (no se puede borrar un estado en uso).
  - `Usuario.usuario` → **OneToOne** con `auth.User` (perfil extendido), CASCADE.
  - `Usuario.rol` → FK, RESTRICT.
  - `DocumentoAdjunto.expediente` → **PROTECT**; `subido_por` → RESTRICT (un documento que viajó en un pase es parte del historial; por eso se **anula** con motivo en vez de borrarse).
  - `HistorialPase.documentos_adjuntos` → **ManyToMany** con `DocumentoAdjunto` (un pase lleva varios documentos y un documento puede figurar en varios pases).
  - `HistorialAccion` (auditoría) → PROTECT: la auditoría no se debe borrar.
  - `Notificacion.usuario_destino` → CASCADE; `expediente_relacionado` y `pase` → SET_NULL.
  - Usamos `related_name` (`pases_enviados`, `pases_recibidos`, `historial_pases`, etc.) para distinguir las dos FK a `User` en `HistorialPase`.
- **Lógica en el modelo:** `FormularioSocioHabitacional.estado` es una `@property` que calcula "sin iniciar / en progreso / completado" contando campos cargados. Constantes `choices` en `EstadoExpediente` y `Rol`. `unique=True` en DNI, DDJJ, matrícula. `auto_now_add` / `auto_now` para fechas.
- **No** hay `clean()` ni validadores a nivel de modelo: decirlo con honestidad. Las validaciones están en serializers.

### B. URLs y vistas ([urls.py](api/gestion/urls.py), [views.py](api/gestion/views.py))

- `ipvu_backend/urls.py` hace `include("gestion.urls")`. `gestion/urls.py` usa un **`DefaultRouter`** que genera el CRUD (`/api/expediente/`, `/api/usuario/`, …) más rutas explícitas (`login`, `token/refresh`, `password-reset`, `procesar-documento`).
- **No usamos `app_name`** (la pauta lo menciona): sí `name=` en las rutas manuales. Si preguntan, decir que con un router y una sola app no hizo falta, pero que correspondería agregarlo.
- **CBV, no FBV:** `ModelViewSet`/`GenericViewSet` y `APIView`. Por qué: el router genera las rutas CRUD solo, el queryset y permisos se definen una vez por recurso, y `@action` agrega endpoints extra (`archivar`, `marcar-visto`, `imprimir`, `exportar-excel`). Para solo lectura usamos mixins (`ListModelMixin`, `RetrieveModelMixin`) en vez de exponer CRUD completo (ej. `HistorialAccion`, `Rol`).
- **Lógica de negocio en backend** (ejemplo tipo "stock mínimo" del kiosco):
  - Asignación round-robin a TS activas: `obtener_siguiente_trabajadora_social()` (views.py ~402).
  - Al pasar a un usuario de Legales, el expediente cambia a estado LEG; al salir vuelve al estado anterior (`HistorialPaseViewSet.perform_create`).
  - Solo puede pasar un expediente quien lo tiene en su poder (`validar_expediente_en_poder`).
  - Baja de usuario → `reasignar_casos_por_baja` reparte sus casos.
  - Archivado: no se puede pasar ni modificar.
- **ORM:** `select_related` / `prefetch_related` en `get_queryset` para evitar N+1, `filter` con `Q`, `get_or_create`, filtros por query params.

### C. Validación y feedback (serializers en lugar de forms)

- [serializers.py](api/gestion/serializers.py): `PostulanteTitularSerializer.validate`, `DocumentoAdjuntoSerializer.validate_archivo` (tipo y tamaño máximo del archivo), `HistorialPaseSerializer.validate`, `EstablecerPasswordInicialSerializer.validate` (contraseñas coinciden), `ConfirmarResetPasswordSerializer.validate` (token del link).
- Contraseñas: `AUTH_PASSWORD_VALIDATORS` de Django activos.
- Feedback: `ValidationError` → HTTP 400 con JSON `{campo: "mensaje"}` → React lo muestra. Confirmaciones: toast de éxito en el frontend.

### D. Seguridad

- **Autenticación:** `simplejwt`. Access 5 min, refresh 30 min con rotación (`SIMPLE_JWT`). Login con throttling (`5/min`), reset de contraseña (`3/hour`).
- **Autorización:** permisos por rol en [permissions.py](api/gestion/permissions.py) (`usuario_tiene_rol` exige: autenticado, perfil activo, contraseña inicial ya cambiada y rol permitido). `get_permissions()` por acción. **Propiedad del registro:** `filtrar_expedientes_en_poder` restringe el queryset a lo que el usuario tiene.
- **Por defecto cerrado:** `DEFAULT_PERMISSION_CLASSES = IsAuthenticated`.
- **ORM** evita SQL injection (consultas parametrizadas).
- **Configuración sensible por entorno:** `SECRET_KEY`, `DATABASE_URL`, claves de IA y correo se leen de variables de entorno ([.env.example](api/.env.example), `.env` en `.gitignore`). Ver [SEGURIDAD_DEPLOY.md](api/SEGURIDAD_DEPLOY.md).
- Archivos adjuntos con datos personales: `/media/` **no se sirve**; se descargan por `documentoadjunto/<id>/descargar/` con login.
- HTTPS opcional con `USAR_HTTPS` (cookies seguras, HSTS), CORS restringible.
- Auditoría en `HistorialAccion` de lo que hace cada usuario.
- Panel `/admin/` con los 10 modelos registrados ([admin.py](api/gestion/admin.py)) — la pauta evalúa "panel de administración", tenerlo abierto.

### E. Plantillas

No aplica (React). Si el usuario pregunta: `TEMPLATES` está configurado por defecto porque lo requiere el admin de Django. Lo equivalente en React: componentes reutilizables y layout común ([Layout.jsx](client/src/components/navBar/Layout.jsx)), rutas protegidas ([ProtectedRoute.jsx](client/src/components/routes/ProtectedRoute.jsx)).

## 4. Puntos débiles: conviene saberlos o arreglarlos antes

1. **`EstadoExpediente.color` no tiene `return`** ([models.py](api/gestion/models.py)): arma el diccionario `colores` pero nunca lo devuelve, así que siempre da `None`. Es un bug real; si la profesora abre esa propiedad, se ve. Arreglo: `return colores.get(self.nombre, 'gray')`.
2. **`SECRET_KEY` tiene un valor por defecto** (`'your secret key'`) si falta la variable. Está bien que lo lea del entorno, pero en producción debería fallar si no está definida. Lo mismo con `ALLOWED_HOSTS='*'` y CORS abierto por defecto: son defaults de desarrollo; explicarlo así.
3. **`ExpedienteViewSet.queryset = ...[:5]`** con slice: el `get_queryset` lo reemplaza, pero queda confuso. Si lo preguntan: es un queryset de relleno para el router, el real está en `get_queryset`.
4. **Una sola app** y **`LANGUAGE_CODE='en-us'`** (los mensajes de validación de Django salen en inglés).
5. **Mensajes con `django.contrib.messages`** instalado pero sin uso: no decir que lo usamos.
6. **Validación a nivel modelo:** no hay `clean()`. Tener una respuesta: "la validamos en el serializer porque es la frontera de entrada de la API".
7. **`views.py` tiene ~2000 líneas**: la pregunta típica es "cómo lo ordenarían" → separar en paquete `views/` y `services.py` para la lógica (asignación, notificaciones, pases).
8. Hay **comentarios con tono informal** ("¡Acá está el cambio!", "NUEVO:") en `views.py`; conviene limpiarlos antes de mostrar código.

## 5. Preguntas probables y cómo encararlas

- *¿Qué pasa si borro un postulante?* CASCADE: se borran sus expedientes y formularios. Y si hay documentos? `DocumentoAdjunto.expediente` es PROTECT → el borrado se **bloquea** (`ProtectedError`). Es un buen ejemplo de interacción entre políticas.
- *¿Por qué PROTECT en la auditoría?* Para que no se pueda perder el rastro borrando usuarios o expedientes.
- *¿Por qué ViewSets y no vistas de función?* Ver 3-B.
- *¿Cómo viaja un request?* Navegador/React → axios con `Authorization: Bearer` → `urls.py` → router → ViewSet → `get_permissions` → serializer (`is_valid`) → `perform_create` → ORM → `INSERT` → serializer → JSON.
- *¿Cómo evitás que una TS vea expedientes de otra?* `get_queryset` + `filtrar_expedientes_en_poder`.
- *¿Por qué no hay CSRF?* JWT en header; el navegador no lo manda solo, así que un sitio ajeno no puede forzar el request.
- *Escenario: agregar un rol "Auditor" de solo lectura.* Agregar la opción en `Rol.tipo_rol` (+ migración), crear `IsAuditor` en `permissions.py`, y sumarlo en `get_permissions` de los ViewSets en modo lectura.
- *Escenario: avisar cuando un expediente lleva más de N días en un área.* Campo calculado/`@property` o comando de management + `Notificacion`.
- *¿Qué es una migración?* Archivo que describe el cambio de esquema; `makemigrations` lo genera, `migrate` lo aplica.

## 6. Qué hago ahora si querés

- Corregir los puntos 1 y 3 de la sección 4 (cambios chicos, sin riesgo).
- Revisar la base de datos y los comandos de datos de prueba para detectar nombres tipo "test/asdf".
- Armar un diagrama de relaciones (`graph_models` ya está disponible porque tienen `django_extensions`).
