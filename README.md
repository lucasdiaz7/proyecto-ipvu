# Sistema de Expedientes — IPVU Santiago del Estero

Sistema web para seguir los expedientes de vivienda del IPVU: carga del postulante, entrevista de la
trabajadora social (formulario socio-habitacional), dictamen de Legales, documentación, impresión del
expediente completo y archivo. Cada movimiento queda registrado en el historial y en la auditoría.

- **Backend:** Django + Django REST Framework (carpeta `api/`), base PostgreSQL en Supabase.
- **Frontend:** React + Tailwind (carpeta `client/`).
- **IA:** microservicio externo que lee la DDJJ y arma el semáforo de inconsistencias.

---

## Índice

1. [Instalación en una compu nueva (paso a paso)](#1-instalación-en-una-compu-nueva-paso-a-paso)
2. [Levantar el sistema cada día](#2-levantar-el-sistema-cada-día)
3. [Mostrarlo a otros en la misma red (wifi)](#3-mostrarlo-a-otros-en-la-misma-red-wifi)
4. [Usuarios de prueba](#4-usuarios-de-prueba)
5. [El circuito completo de un expediente](#5-el-circuito-completo-de-un-expediente)
6. [Qué puede hacer cada rol](#6-qué-puede-hacer-cada-rol)
7. [Funcionalidades](#7-funcionalidades)
8. [Comandos útiles](#8-comandos-útiles)
9. [Problemas comunes y cómo resolverlos](#9-problemas-comunes-y-cómo-resolverlos)
10. [Trabajo con git](#10-trabajo-con-git)

---

## 1. Instalación en una compu nueva (paso a paso)

Todo se hace **una sola vez**. Los comandos son para **PowerShell** en Windows (en VS Code: Terminal → New Terminal).

### 1.1 Programas que hay que instalar

| Programa | Versión | Dónde | Ojo |
|---|---|---|---|
| **Python** | 3.12 o 3.13 | https://www.python.org/downloads/ | Al instalar, **marcar "Add Python to PATH"** |
| **Node.js** | 20 o más nuevo (LTS) | https://nodejs.org/ | Trae `npm` incluido |
| **Git** | cualquiera | https://git-scm.com/ | |
| VS Code | opcional | https://code.visualstudio.com/ | |

Para comprobar que quedaron instalados, abrir una terminal **nueva** y correr:

```powershell
python --version    # o: py --version
node --version
npm --version
git --version
```

### 1.2 Bajar el proyecto

```powershell
git clone https://github.com/lucasdiaz7/proyecto-ipvu.git
cd proyecto-ipvu
git checkout main
```

### 1.3 El archivo `api/.env` (claves de la base de datos)

El backend necesita el archivo **`api/.env`** con la dirección y la contraseña de la base de datos.
**No se escribe a mano ni se publica:** se copia del equipo que ya lo tiene (pendrive, mensaje privado).

- Ponerlo exactamente en `proyecto-ipvu/api/.env`.
- La plantilla con todas las variables explicadas está en [`api/.env.example`](api/.env.example).
- Variables mínimas para que funcione:

```
DATABASE_URL=postgresql://USUARIO:CONTRASEÑA@HOST:PUERTO/postgres
IA_API_URL=https://microservicio-fastapi-ma19.onrender.com
```

> Si la contraseña de la base se cambia (ver [9.8](#98-cambiar-la-contraseña-de-la-base-de-datos)),
> hay que actualizar `DATABASE_URL` en el `.env` de **todas** las compus.

### 1.4 Backend (Python)

```powershell
cd api
py -m venv venv                    # crea el entorno virtual (si falla, probar: python -m venv venv)
.\venv\Scripts\activate            # activa el entorno: aparece (venv) al principio de la línea
pip install -r requirements.txt    # instala Django, reportlab, pypdf, etc.
python manage.py migrate           # deja la base al día (si ya está al día dice "No migrations to apply")
python manage.py check             # tiene que decir "System check identified no issues"
```

> Si `.\venv\Scripts\activate` tira un error rojo de permisos, correr una vez
> `Set-ExecutionPolicy RemoteSigned -Scope CurrentUser`, contestar `S` y volver a activar.

### 1.5 Frontend (React)

En **otra** terminal, desde la carpeta del proyecto:

```powershell
cd client
npm install        # tarda unos minutos la primera vez
```

Listo: ya está todo instalado. Para usarlo, seguir la sección 2.

---

## 2. Levantar el sistema cada día

Se necesitan **dos terminales abiertas** al mismo tiempo (no cerrarlas mientras se usa el sistema).

**Terminal 1 — backend:**

```powershell
cd proyecto-ipvu\api
.\venv\Scripts\activate
python manage.py runserver
```

Queda en http://localhost:8000 (si se abre en el navegador muestra un error 401: es normal, pide login).

**Terminal 2 — frontend:**

```powershell
cd proyecto-ipvu\client
npm start
```

Se abre solo el navegador en **http://localhost:3000**. Entrar con un [usuario de prueba](#4-usuarios-de-prueba).

> Después de un `git pull`, por si cambiaron dependencias: `pip install -r requirements.txt` (con el venv
> activado), `python manage.py migrate` y, en `client`, `npm install`.

---

## 3. Mostrarlo a otros en la misma red (wifi)

Para que otras compus o celulares **conectados al mismo wifi** entren al sistema:

1. Averiguar la IP de la notebook: `ipconfig` → buscar **"Dirección IPv4"** del adaptador Wi-Fi
   (algo como `192.168.1.9`). En los ejemplos de abajo, reemplazar `192.168.1.9` por esa IP.

2. **Terminal 1 — backend** abierto a la red:

   ```powershell
   cd proyecto-ipvu\api
   .\venv\Scripts\activate
   python manage.py runserver 0.0.0.0:8000
   ```

3. **Terminal 2 — frontend** abierto a la red y apuntando al backend por IP:

   ```powershell
   cd proyecto-ipvu\client
   $env:HOST="0.0.0.0"
   $env:REACT_APP_API_URL="http://192.168.1.9:8000/api"
   npm start
   ```

4. Los demás entran a **http://192.168.1.9:3000**.

- Si Windows pregunta por el **firewall**, permitir "Python" y "Node.js" en **redes privadas**.
- Si la red es pública (wifi de facultad, bar), Windows puede bloquear el acceso: en ese caso usar el
  hotspot del celular o mostrarlo solo desde la notebook (`http://localhost:3000`).
- Al descargar un archivo por `http://IP`, el navegador puede avisar "archivo peligroso" o "no seguro":
  es porque la conexión no es HTTPS, no porque el archivo tenga algo. Elegir "Conservar".

---

## 4. Usuarios de prueba

Usuario y contraseña son el mismo número. **Son solo para la demo.**

| Usuario / contraseña | Persona | Rol |
|---|---|---|
| `44444444` | Laura Diaz | Administrador (superadmin) |
| `33333333` | Carlos Perez | Mesa de Entrada (data entry) |
| `11111111` | Sofia Gomez | Trabajadora Social |
| `22222222` | Martin Lopez | Legales |

Los usuarios nuevos entran la primera vez con su DNI como contraseña y el sistema les pide cambiarla.

---

## 5. El circuito completo de un expediente

```
Mesa de Entrada carga ──► Trabajadora Social ──► Mesa de Entrada ──► (Legales) ──► Mesa de Entrada
  [Sin Iniciar]            hace la entrevista      decide el estado     [Legales]      Apto → Doc Presentada
                           [1ra Visita]                                                → Imprimir → Archivar
```

| Estado | Quién / cuándo se pone |
|---|---|
| **Sin Iniciar** | Automático, al cargar el expediente. Se asigna solo, por turno, a una TS activa. |
| **1ra Visita** | Automático, cuando la TS guarda el formulario socio-habitacional. |
| **Legales** | Automático, cada vez que el expediente se pasa a alguien de Legales (se espera un dictamen). Al salir de Legales **vuelve solo al estado que tenía antes**. |
| **Apto / No Apto / Nueva Visita** | Los decide **Mesa de Entrada** (botón **Guardar estado**, sin hacer pase; o al hacer un pase). |
| **Doc Presentada** | Mesa de Entrada, con el botón **Marcar Doc Presentada**. Solo si está en Apto y el formulario está completo. |

### Demo paso a paso (con los usuarios de prueba)

Usar un expediente que tenga Sofia, por ejemplo el **#277 (Bravo Diego)**, que ya tiene el formulario completo.

1. **Sofia (11111111)** abre el #277, escribe la observación y lo **envía a Mesa de Entrada → Carlos Perez**.
2. **Carlos (33333333)** lo **envía a Legales → Martin Lopez**. El estado pasa solo a *Legales*.
3. **Martin (22222222)** adjunta el dictamen (PDF o foto), escribe la observación y **se lo devuelve a Carlos**.
   El estado vuelve solo al que tenía.
4. **Carlos** elige **Apto** en "Estado de Expediente" y aprieta **Guardar estado**.
5. Cuando la persona presenta la documentación: **Marcar Doc Presentada**.
6. **Imprimir expediente** → se abre un único PDF con carátula, datos del titular, índice, formulario
   socio-habitacional y todos los documentos adjuntos.
7. Ya impreso, aparece **Archivar**. El expediente pasa a "Archivados" (se puede **Desarchivar**).
8. **Laura (44444444)** ve todo en modo lectura, puede imprimir, exportar a Excel y revisar la **Auditoría**.

**Nueva Visita:** si Mesa de Entrada detecta una inconsistencia, pone *Nueva Visita* y se lo pasa a la TS.
La TS ve el botón **Formulario de nueva visita** (no es obligatorio completarlo). El formulario anterior
queda guardado en el historial y la impresión usa siempre el último.

---

## 6. Qué puede hacer cada rol

| | Mesa de Entrada | Trabajadora Social | Legales | Administrador |
|---|---|---|---|---|
| Ve los expedientes | los que tiene en su poder | los que tiene en su poder | los que tiene en su poder | **todos** (solo lectura si no los tiene él) |
| Carga expedientes nuevos | ✅ | | | |
| Hace pases / adjunta archivos | ✅ en su poder | ✅ en su poder | ✅ en su poder | ✅ solo en su poder |
| Formulario socio-habitacional | | ✅ | | |
| Cambia el estado | ✅ | | | |
| Doc Presentada / Archivar | ✅ | | | |
| Imprimir expediente completo | ✅ | ✅ | ✅ | ✅ |
| Usuarios, Auditoría, Excel | | | | ✅ |

**Regla general:** cada uno solo actúa sobre los expedientes que tiene **en su poder**. Al hacer un pase,
el expediente deja de ser suyo. El administrador ve todo, pero lo que no es suyo lo ve en modo lectura.

---

## 7. Funcionalidades

### Expedientes
- **Listado** con búsqueda (DDJJ, nombre, DNI), filtro por estado, **días en poder (mínimo)** y
  **fecha de creación (desde / hasta)**. Botón **Archivados (N)** para ver los archivados.
- **Expedientes nuevos (TS):** el botón muestra un resumen de cada expediente sin ver
  (titular, DNI, DDJJ, domicilio, días) y al hacer clic lo abre.
- **Detalle:** datos del titular, documentos con **vista previa** (PDF e imágenes sin descargar),
  semáforo de inconsistencias con IA, acciones y **historial de movimientos**.
- **Historial de movimientos:** cada pase se lee "**Quién envió** (rol) → **quién recibió** (rol)", con la
  observación destacada y los archivos que viajaron en ese pase. El primer movimiento es la
  **asignación automática** ("Caso asignado a… / Cargado por…").
- **Imprimir expediente completo** (con Doc Presentada): un solo PDF. Los archivos que no se pueden
  imprimir (Word, Excel, PDF con contraseña) figuran en el índice como "No incluido".
- **Archivar / Desarchivar:** el último paso, después de imprimir. Un expediente archivado no se puede
  pasar ni modificar.

### Usuarios (administrador)
- Filtros por perfil, búsqueda y **Activos / Inactivos**.
- Botón **Activo / Inactivo**. Al desactivar a alguien que tiene expedientes, el sistema pregunta:
  - **Ausencia temporal** (vacaciones, licencia): sus casos quedan a su nombre esperándolo.
  - **Baja definitiva** (renuncia): hay que **escribir su DNI** para confirmar; sus casos se reparten por
    turno entre los usuarios activos de su mismo rol.
- Un usuario inactivo **no puede entrar** al sistema ni recibir expedientes.
- Los usuarios **nunca se borran**: los dados de baja quedan en el listado como *Inactivo* (filtro
  "Solo inactivos"). Al **reactivarlo**, si se le habían repartido casos que nadie movió, el sistema
  ofrece **devolvérselos**.

### Administración
- **Auditoría:** todo lo que hizo cada usuario (ver, pasar, subir, imprimir, archivar…), con filtros.
- **Exportar a Excel:** expedientes con filtros (estado, TS, discapacidad, fechas) y hoja de resumen.
  Si los filtros no traen resultados, avisa en lugar de bajar un Excel vacío.

---

## 8. Comandos útiles

Todos desde `api/` con el entorno virtual activado.

| Comando | Para qué |
|---|---|
| `python manage.py runserver` | Levantar el backend |
| `python manage.py migrate` | Aplicar cambios de estructura a la base |
| `python manage.py test gestion` | Correr las pruebas automáticas (~170 pruebas, tardan unos 9 minutos; usan una base temporal, no tocan la real) |
| `python manage.py reconstruir_asignaciones` | Muestra a qué expedientes viejos les falta el primer movimiento ("asignación automática"). Con `--aplicar` los crea. Ya se corrió. |
| `python manage.py reasignar_casos_de_baja` | Muestra expedientes que quedaron a nombre de usuarios dados de baja. Con `--aplicar` los reparte. |

---

## 9. Problemas comunes y cómo resolverlos

### 9.1 `python` / `py` no se reconoce
Python no quedó en el PATH. Reinstalarlo marcando **"Add Python to PATH"** y abrir una terminal nueva.

### 9.2 Error rojo de permisos al activar el venv
`Set-ExecutionPolicy RemoteSigned -Scope CurrentUser` → `S` → volver a activar.

### 9.3 `did not find executable at ... python.exe` al usar el venv
El entorno virtual se creó con un Python que ya no está. Borrar la carpeta `api\venv` y repetir el paso 1.4.

### 9.4 `ModuleNotFoundError: No module named 'pypdf'` (u otro módulo)
Faltan dependencias: con el venv activado, `pip install -r requirements.txt`.

### 9.5 El backend no conecta con la base
- Revisar que exista `api/.env` y que `DATABASE_URL` esté bien.
- Si la contraseña tiene caracteres especiales (`@ : / # ?`), hay que escribirlos codificados
  (`@` → `%40`, `#` → `%23`, `/` → `%2F`, `:` → `%3A`, `?` → `%3F`).
- Algunas redes (facultad, empresa) bloquean el puerto de la base: probar con el hotspot del celular.

### 9.6 La página carga pero no trae datos / no deja entrar
- El backend tiene que estar corriendo (terminal 1).
- Si se entra por IP (sección 3), `REACT_APP_API_URL` tiene que apuntar a la IP de la notebook y
  `npm start` hay que correrlo **después** de definir esa variable, en la misma terminal.

### 9.7 El puerto 3000 u 8000 está ocupado
Quedó una terminal vieja corriendo: cerrarla. Para el frontend, `npm start` ofrece usar otro puerto: contestar `Y`.

### 9.8 Cambiar la contraseña de la base de datos
1. Entrar a https://supabase.com → el proyecto → en la barra de la izquierda, **Database** (ícono de
   cilindro) → en "Configuration", **Settings** → **Database password → Reset database password**.
   Link directo: `https://supabase.com/dashboard/project/<código-del-proyecto>/database/settings`
   (el código es lo que va después de `postgres.` en `DATABASE_URL`). Solo el dueño (Owner) o un Admin
   del proyecto pueden hacerlo. Copiar la contraseña nueva (mejor solo letras y números).
2. En `api/.env`, en `DATABASE_URL`, reemplazar **solo** la contraseña (lo que está entre
   `postgres.xxxxx:` y `@aws-...`). La dirección completa también está en el botón **Connect** de arriba
   del proyecto → **Transaction pooler** (puerto 6543). Si la contraseña tiene caracteres especiales,
   codificarlos (ver 9.5).
3. Reiniciar el backend (Ctrl+C en la terminal 1 y `python manage.py runserver` de nuevo).
4. Pasarle el `.env` nuevo, por privado, a cada integrante del equipo.

---

## 10. Trabajo con git

Cada uno trabaja en su rama y después se integra:

```powershell
git checkout -b mi-rama          # crear una rama nueva
git add .
git commit -m "Qué cambié"
git push origin mi-rama          # después, Pull Request en GitHub hacia develop / main
```

Nunca subir: `api/.env` (claves), `api/media/` (archivos con datos personales), `venv/` ni `node_modules/`
(ya están en `.gitignore`).
