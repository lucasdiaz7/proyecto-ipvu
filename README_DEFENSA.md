# Defensa de Django — versión fácil

## Antes de empezar: tranquilos

La profesora quiere ver tres cosas: que **el sistema funciona**, que **saben explicar qué hace cada parte** y que **no leen el código línea por línea**. No hace falta saber de memoria. Hace falta poder decir "esto sirve para tal cosa y lo hicimos así porque...".

Si no saben algo, se dice: *"eso no lo implementamos, pero lo haríamos así..."*. Ella misma dijo: lo que no usaron, no se defiende.

## 1. Cómo funciona todo, en una imagen (aprendan esto primero)

Pensalo como un **restaurante**:

- **El cliente (React)** = el navegador. Hace el pedido.
- **El mozo (urls.py)** = mira el pedido y lo lleva a la cocina correcta.
- **El jefe de cocina (la vista / ViewSet)** = decide qué hacer con el pedido. Primero verifica que el cliente pueda pedir eso (permisos).
- **El control de calidad (el serializer)** = revisa que el pedido esté bien armado (datos válidos).
- **La despensa (models.py y la base de datos)** = donde se guardan los datos. Se habla con ella por medio del ORM.
- **El plato que vuelve (JSON)** = la respuesta que React dibuja en pantalla.

**Frase para decir:** *"El usuario hace una acción en React, que manda una petición a la API. Django la recibe en urls.py, la deriva a la vista, la vista chequea permisos, el serializer valida los datos, el ORM guarda en la base y devolvemos la respuesta en JSON."*

## 2. Lo que hay que aclarar al principio: usamos React

Nuestro proyecto es **Django + React**. Django funciona solo como backend (API). Por eso:

- **No hay plantillas (templates)**: la pantalla la hace React. La profesora dijo que en ese caso no se defiende ese punto.
- **Los serializers hacen el trabajo de los formularios** de Django: validan lo que llega.
- **No usamos csrf_token** porque no usamos sesiones con cookies: usamos **tokens JWT**. Frase: *"El token viaja en un header que el navegador no manda solo, entonces otro sitio no puede hacerse pasar por el usuario."*

Digan esto **ustedes** al comienzo, con seguridad. Así no parece que se olvidaron de algo.

## 3. El guion, minuto a minuto (unos 22 minutos)

### Minuto 0 a 3: Introducción

Qué decir: *"Nuestro sistema es para el IPVU. Gestiona los expedientes de personas que se postulan a una vivienda. Antes los expedientes circulaban en papel entre áreas. Ahora se cargan en el sistema, se asignan solos a una Trabajadora Social, pasan por Legales, se guarda todo el historial y al final se archivan."*

Los usuarios son 4 tipos:
- **Data Entry:** carga los expedientes nuevos.
- **Trabajadora Social:** visita, completa el formulario socio-habitacional.
- **Legales:** revisa la parte legal.
- **Superusuario (admin):** administra usuarios, ve auditoría y exporta.

### Minuto 3 a 7: Arquitectura y modelos

Mostrar [models.py](api/gestion/models.py). Qué decir:

- *"Tenemos una app llamada `gestion` porque todo el sistema gira alrededor de un mismo tema: el expediente. Si tuviéramos que crecer, separaríamos usuarios, expedientes y notificaciones."*
- Los modelos principales: **PostulanteTitular** (la persona), **Expediente**, **Usuario** y **Rol**, **HistorialPase** (los pases entre áreas), **DocumentoAdjunto**, **Notificacion**, **HistorialAccion** (auditoría) y **FormularioSocioHabitacional**.

#### Las relaciones, explicadas fácil

- **Un postulante tiene muchos expedientes** (ForeignKey). Si borrás al postulante, se borran sus expedientes (CASCADE).
- **Un usuario de Django tiene un solo perfil `Usuario`** (OneToOne). El perfil guarda el rol, la matrícula y si está activo.
- **Un pase puede llevar muchos documentos y un documento puede ir en muchos pases** (ManyToMany).

#### El `on_delete`, la pregunta más probable

- **CASCADE** = "si desaparece el padre, desaparece el hijo". Ejemplo: sin postulante no hay expediente.
- **PROTECT / RESTRICT** = "no te dejo borrar mientras haya algo que dependa de esto". Ejemplo: no se puede borrar un estado que esté en uso, ni un usuario con historial.
- **SET_NULL** = "borro al padre pero el hijo queda, con ese campo vacío". Ejemplo: si se borra un usuario, el expediente queda sin asignar.

Por qué: *"Los datos del historial y la auditoría no se pueden perder, por eso los protegimos."*

#### Lógica dentro del modelo

El formulario socio-habitacional tiene una **propiedad** (`@property`) llamada `estado`. Calcula si el formulario está "sin iniciar", "en progreso" o "completado" contando cuántos campos tienen texto. No se guarda en la base: se calcula cada vez.

### Minuto 7 a 13: Demo en vivo

Hacerla en este orden, siempre con datos reales ya cargados:

1. Entrar como **Data Entry** y cargar un expediente (mostrar la precarga con IA si hay internet, si no, el video).
2. Mostrar que **se asigna solo** a una Trabajadora Social (se turnan, una por una) y que a ella le **llega una notificación**.
3. Entrar como **Trabajadora Social**: completa el formulario y ve el semáforo de inconsistencias.
4. Hacer un **pase a Legales**: el expediente cambia a estado "Legales".
5. Entrar como **Legales**, devolverlo.
6. Entrar como **admin**: ver usuarios, auditoría, exportar y el panel `/admin`.

Punto clave a remarcar: *"Cada rol ve y puede hacer cosas distintas."*

### Minuto 13 a 20: Código del backend

Abrir el editor y mostrar solo estas 4 cosas:

1. **[urls.py](api/gestion/urls.py):** *"Usamos un router de DRF que genera automáticamente las rutas del CRUD de cada modelo, y agregamos a mano el login y el reseteo de contraseña."*
2. **[views.py](api/gestion/views.py):** elegir **un** ejemplo, el pase (`HistorialPaseViewSet`): *"Primero chequea que quien envía tenga el expediente en su poder. Verifica que el destinatario esté activo. Guarda el pase, cambia el usuario asignado, cambia el estado si va a Legales y crea la notificación."*
3. **[serializers.py](api/gestion/serializers.py):** *"Acá validamos lo que ingresa el usuario. Por ejemplo, los adjuntos: controlamos el tipo y el tamaño del archivo. Si algo está mal, devolvemos un error 400 con el mensaje y React lo muestra."*
4. **[permissions.py](api/gestion/permissions.py):** *"Una clase de permiso por rol. Chequea que esté logueado, que esté activo, que ya haya cambiado la contraseña inicial y que su rol esté permitido."*

### Minuto 20 en adelante: Preguntas

Ver la sección 6.

## 4. Vocabulario que tienen que usar

- **ORM:** la herramienta de Django para hablar con la base con código Python en vez de SQL. *No digan "SQL" ni "MySQL".* Nuestra base es **PostgreSQL**, pero siempre a través del ORM.
- **Migración:** archivo que describe un cambio en las tablas. `makemigrations` lo crea y `migrate` lo aplica.
- **ViewSet:** una clase que agrupa en un solo lugar las acciones de un recurso (listar, crear, editar, borrar).
- **Serializer:** convierte los datos a JSON y al revés, y además los valida.
- **JWT:** token firmado que prueba quién es el usuario. Dura 5 minutos y se renueva solo.
- **Queryset:** el resultado de una consulta del ORM.

## 5. Seguridad: la lista para recitar

1. **Login con JWT**, con límite de intentos (5 por minuto) para frenar fuerza bruta.
2. **Permisos por rol:** cada acción exige un rol.
3. **Por defecto todo está cerrado:** una vista nueva sin permisos pide login.
4. **Cada usuario ve solo lo que tiene en su poder** (filtros en el queryset).
5. **El ORM evita la inyección SQL.**
6. **Datos sensibles en variables de entorno** (archivo `.env` que no se sube al repo): `SECRET_KEY`, base de datos, claves de la IA.
7. **Los adjuntos no son públicos:** se descargan solo con login.
8. **Auditoría:** se registra qué hizo cada usuario.

La `SECRET_KEY` firma los tokens y los links de reseteo de contraseña. Por eso nunca va en el código.

## 6. Preguntas probables, con respuesta corta

- **¿Por qué una sola app?** *"Porque es un único dominio muy conectado. Si crece, lo separaríamos."*
- **¿Por qué clases (ViewSets) y no funciones?** *"Porque el router genera el CRUD solo y los permisos se definen una vez por recurso. Para endpoints especiales usamos `@action`."*
- **¿Qué pasa si borro un postulante?** *"Se borran sus expedientes por CASCADE. Pero si el expediente tiene documentos, Django lo bloquea porque los documentos están en PROTECT."*
- **¿Por qué los documentos no se borran?** *"Porque viajaron en un pase y son parte del historial. Se anulan con un motivo."*
- **¿Por qué no usan messages de Django?** *"Como es una API, devolvemos errores en JSON y el frontend los muestra."*
- **¿Cómo evitan que una Trabajadora Social vea expedientes de otra?** *"El queryset se filtra por el expediente que tiene en su poder."*
- **¿Qué mejorarían?** *"Separar el código de views.py, que es muy largo, en varios archivos, y pasar la lógica a un módulo de servicios. También agregar validaciones en los modelos."*
- **Si piden agregar un rol nuevo:** *"Lo agregaría en las opciones de `Rol`, haría la migración, crearía una clase de permiso en `permissions.py` y la sumaría a las vistas."*

## 7. Cosas para arreglar o conocer antes del día

1. En `EstadoExpediente.color` falta el `return`: siempre devuelve nada. Mejor arreglarlo o no abrir esa parte.
2. Hay una consulta con `[:5]` en `ExpedienteViewSet` que confunde. Si la preguntan: *"Es un valor de relleno para el router; el real se arma en `get_queryset`."*
3. Limpiar comentarios informales en `views.py` antes de mostrarlo.
4. Revisar que no haya datos como "test", "asdf" o "prueba 1".

## 8. Lista del día de la defensa

- Entorno virtual activado, backend y frontend corriendo.
- Editor abierto en `models.py`, `urls.py`, `views.py`, `serializers.py`, `permissions.py`.
- Usuarios y contraseñas de **cada rol** anotados y probados.
- Base con datos realistas.
- **Video grabado** de la IA y de la conexión a la base, por si no hay internet.
- Repartir quién explica cada bloque: **la nota también es individual**, así que cada integrante tiene que hablar y poder responder.

## 9. Si solo se acuerdan de cinco cosas

1. Es Django + React: Django es la API, no hay plantillas.
2. El camino de una petición: urls, vista, permisos, serializer, ORM, JSON.
3. Las relaciones y el `on_delete` (CASCADE, PROTECT, SET_NULL).
4. La seguridad: JWT, permisos por rol, variables de entorno.
5. Explicar el para qué, no leer el código.
