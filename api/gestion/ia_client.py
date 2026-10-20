"""
Cliente del microservicio de IA (FastAPI) que extrae los datos de una DDJJ escaneada o en PDF.

Django hace de intermediario: el frontend nunca habla directo con el microservicio.
Aca tambien se traduce la respuesta del microservicio a los nombres de campo de nuestro formulario,
asi un cambio de formato del lado de IA se corrige en un solo lugar.
"""
import logging
import re
from datetime import datetime

import requests
from django.conf import settings

logger = logging.getLogger(__name__)

# formatos en los que puede llegar la fecha de inscripcion (el de hoy es dd/mm/aaaa)
FORMATOS_FECHA = ('%Y/%m/%d', '%d/%m/%Y', '%d/%m/%y')


class IAServiceError(Exception):
    """El microservicio respondio con un error interno o con datos que no se pueden usar."""


class IAServiceRejected(IAServiceError):
    """El microservicio rechazo el archivo (formato invalido, archivo vacio, etc.)."""


class IAServiceUnavailable(IAServiceError):
    """El microservicio no responde: esta apagado, no hay red o tardo demasiado."""


def autocompletar_ddjj(archivo):
    """
    Envia el archivo al endpoint /autocompletar-ddjj y devuelve los datos con los nombres
    de campo de nuestro formulario de nuevo expediente.
    """
    url = f"{settings.IA_API_URL.rstrip('/')}/autocompletar-ddjj"
    headers = {'X-API-Key': settings.IA_API_KEY} if settings.IA_API_KEY else {}

    archivo.seek(0)
    files = {'archivo': (archivo.name, archivo.read(), archivo.content_type or 'application/octet-stream')}

    try:
        response = requests.post(url, files=files, headers=headers, timeout=settings.IA_API_TIMEOUT)
    except requests.Timeout as e:
        raise IAServiceUnavailable('El servicio de IA tardó demasiado en responder.') from e
    except requests.ConnectionError as e:
        raise IAServiceUnavailable('No se pudo conectar con el servicio de IA.') from e

    if 400 <= response.status_code < 500:
        raise IAServiceRejected(_detalle_error(response) or 'El servicio de IA rechazó el archivo.')
    if not response.ok:
        raise IAServiceError(f'HTTP {response.status_code}: {_detalle_error(response)}')

    try:
        datos = response.json()
    except ValueError as e:
        raise IAServiceError('El servicio de IA devolvió una respuesta que no es JSON.') from e

    return normalizar_datos_ddjj(datos)


def normalizar_datos_ddjj(datos):
    """Traduce la respuesta del microservicio (modelo DatosDDJJ) a los campos de nuestro formulario."""
    return {
        'ddjj': _texto(datos.get('numero_ddjj')),
        # si el microservicio todavia no separa el apellido, el nombre completo queda en 'nombre'
        # y la operadora lo separa a mano: adivinar el corte falla con nombres compuestos
        'nombre': _texto(datos.get('nombre')),
        'apellido': _texto(datos.get('apellido')),
        'dni': _solo_digitos(datos.get('dni') or datos.get('dni_titular')),
        'telefono': _texto(datos.get('telefono')),
        'domicilio_actual': _texto(datos.get('domicilio_actual')),
        'email': _texto(datos.get('email')),
        'discapacidad': _texto(datos.get('discapacidad')),
        # el <input type="date"> del formulario solo acepta AAAA-MM-DD
        'fecha_inscripcion': _fecha_iso(datos.get('fecha_inscripcion')),
    }


def _texto(valor):
    if valor is None:
        return None
    texto = ' '.join(str(valor).split())
    return texto or None


def _solo_digitos(valor):
    digitos = re.sub(r'\D', '', str(valor or ''))
    return digitos or None


def _fecha_iso(valor):
    texto = _texto(valor)
    if not texto:
        return None
    texto = re.sub(r'[.\-]', '/', texto.replace(' ', ''))
    for formato in FORMATOS_FECHA:
        try:
            return datetime.strptime(texto, formato).date().isoformat()
        except ValueError:
            continue
    logger.warning(f'Fecha de inscripcion con formato no reconocido: {valor!r}')
    return None


def _detalle_error(response):
    # FastAPI devuelve los errores como {"detail": "..."}
    try:
        detalle = response.json().get('detail')
    except (ValueError, AttributeError):
        detalle = None
    return str(detalle) if detalle else response.text[:300]
