# Claves y seguridad para el deploy

Todo lo sensible del backend se configura con variables de entorno. En local se leen del archivo `api/.env`; en el servidor de producción se cargan en el `.env` del servidor o en las variables de entorno del servicio. **No hay claves escritas en el código.**

La lista completa de variables, con su explicación, está en [`.env.example`](.env.example).

## Situación actual (desarrollo)

- `api/.env` **está subido al repositorio** e incluye la contraseña de la base de Supabase. Se aceptó así mientras el repo sea privado y el sistema esté en desarrollo.
- Sin variables definidas, el backend usa valores de desarrollo: `DEBUG=False`, cualquier dominio permitido, CORS abierto, correos impresos en la terminal y una `SECRET_KEY` insegura.

## Checklist el día del deploy

Hacerlo en este orden.

### 1. Sacar el `.env` del repositorio

```bash
git rm --cached api/.env
git commit -m "Dejar de versionar api/.env"
```

`.gitignore` ya está preparado para ignorarlo desde ese momento.

> **Avisar al equipo antes:** al hacer pull de ese commit, git **borra** el `api/.env` local de cada integrante. Cada uno debe copiarlo a otro lado antes y restaurarlo después.

### 2. Cambiar todas las claves que estuvieron en el repo

Sacar el archivo no alcanza: las claves quedan para siempre en el historial de git.

| Clave | Dónde se cambia |
|---|---|
| Contraseña de la base | Panel de la base (Supabase: Settings → Database → Reset database password). Si producción usa una base propia de la provincia, crearla con una contraseña nueva. |
| Contraseña del usuario de `PRUEBAS_USUARIO` | Desde el sistema, o eliminar ese usuario en producción |

### 3. Completar el `.env` del servidor

Partir de `.env.example`. Mínimo indispensable:

```
DATABASE_URL=postgresql://USUARIO:CONTRASEÑA_NUEVA@HOST:5432/BASE
SECRET_KEY=<generada, ver abajo>
DEBUG=False
ALLOWED_HOSTS=api.ipvu.example.gob.ar
CORS_ALLOWED_ORIGINS=https://ipvu.example.gob.ar
FRONTEND_URL=https://ipvu.example.gob.ar
USAR_HTTPS=True
```

Los dominios son ejemplos: reemplazarlos por los reales del servidor de la provincia.

Generar la `SECRET_KEY` (una sola vez, y guardarla solo en el servidor):

```bash
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

> Cambiar la `SECRET_KEY` cierra la sesión de todos los usuarios e invalida los links de reseteo de contraseña pendientes. Es esperable.

Si el sistema debe enviar correos reales (reseteo de contraseña), completar también `EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend` y los datos `EMAIL_*` del servidor de correo.

Si se usa el microservicio de IA: `IA_API_URL` con su dirección y `IA_API_KEY` con la clave que entregue ese equipo.

### 4. Verificar

```bash
python manage.py check --deploy
```

Solo deben quedar estas dos advertencias, que son **esperables**:

- `security.W005` (`SECURE_HSTS_INCLUDE_SUBDOMAINS`)
- `security.W021` (`SECURE_HSTS_PRELOAD`)

Activarlas obligaría a usar HTTPS en **todos** los subdominios del dominio. En un dominio provincial esos subdominios pertenecen a otros organismos, así que no se activan sin consultarlo con quien administra el dominio.

Si aparece cualquier otra advertencia (`SECRET_KEY`, `DEBUG`, cookies, HTTPS), revisar la variable correspondiente.

## Pendientes de seguridad que no son claves

Conviene resolverlos antes de producción. No se tocaron todavía porque cambian el comportamiento de la API:

- `DEFAULT_PERMISSION_CLASSES` es `AllowAny` en `settings.py`: toda vista que no defina sus propios permisos queda abierta sin login.
- Las tablas de la base no tienen RLS activado (Supabase lo marca como error en el Security Advisor).
- `SECURE_HSTS_SECONDS` arranca en una hora; subirlo (por ejemplo, a un año) cuando se confirme que todo funciona por HTTPS.
