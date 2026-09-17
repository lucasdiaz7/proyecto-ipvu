import io
import os
import re
import shutil
import logging
from datetime import datetime
from PIL import Image

logger = logging.getLogger(__name__)


def _configurar_tesseract():
    """
    Configura la ruta del ejecutable de Tesseract en Windows si no está en el PATH del sistema.
    """
    import pytesseract
    if not shutil.which("tesseract"):
        rutas_comunes = [
            r"C:\Program Files\Tesseract-OCR\tesseract.exe",
            r"C:\Program Files (x86)\Tesseract-OCR\tesseract.exe",
            os.path.expandvars(r"%LOCALAPPDATA%\Programs\Tesseract-OCR\tesseract.exe"),
        ]
        for ruta in rutas_comunes:
            if os.path.exists(ruta):
                pytesseract.pytesseract.tesseract_cmd = ruta
                logger.info(f"Tesseract configurado en: {ruta}")
                break
    return pytesseract


def _obtener_idiomas_ocr(pytesseract_mod):
    """
    Detecta los idiomas instalados en Tesseract para priorizar español e inglés.
    """
    try:
        langs = pytesseract_mod.get_languages()
        if "spa" in langs and "eng" in langs:
            return "spa+eng"
        elif "spa" in langs:
            return "spa"
        elif "eng" in langs:
            return "eng"
    except Exception as e:
        logger.warning(f"No se pudieron consultar los idiomas de Tesseract: {e}")
    return "spa+eng"


def extraer_texto_pymupdf_y_ocr(archivo_bytes, nombre_archivo=""):
    """
    Extrae el texto de un archivo PDF o imagen:
    - PDFs con texto digital nativo: extraídos mediante PyMuPDF (fitz) a máxima velocidad.
    - PDFs escaneados (sin texto o con poco texto): PyMuPDF renderiza las páginas y pytesseract realiza OCR.
    - Imágenes (.png, .jpg, .jpeg, etc.): procesadas directamente con pytesseract.
    """
    import pymupdf
    pytesseract = _configurar_tesseract()
    ocr_lang = _obtener_idiomas_ocr(pytesseract)

    nombre_lower = (nombre_archivo or "").lower()
    es_pdf = nombre_lower.endswith(".pdf") or archivo_bytes[:4] == b"%PDF"

    texto_acumulado = []
    metodo_usado = "desconocido"

    if es_pdf:
        try:
            doc = pymupdf.open(stream=archivo_bytes, filetype="pdf")
            total_paginas = len(doc)
            texto_digital_total = []

            for index in range(total_paginas):
                pagina = doc[index]
                texto_pag = pagina.get_text("text") or ""
                texto_digital_total.append(texto_pag)

            texto_unido = "\n".join(texto_digital_total).strip()

            # Verificamos si el documento contiene texto digital nativo suficiente (> 30 caracteres alfanuméricos)
            caracteres_utiles = len(re.findall(r"[a-zA-Z0-9]", texto_unido))
            if caracteres_utiles >= 30:
                metodo_usado = "pymupdf_digital"
                texto_acumulado.append(texto_unido)
            else:
                metodo_usado = "pymupdf_ocr"
                logger.info(f"PDF escaneado detectado ({caracteres_utiles} chars nativos). Aplicando OCR por página...")
                for index in range(total_paginas):
                    pagina = doc[index]
                    mat = pymupdf.Matrix(2.0, 2.0) # 200 DPI
                    pix = pagina.get_pixmap(matrix=mat)
                    img = Image.open(io.BytesIO(pix.tobytes("png")))
                    texto_ocr_pag = pytesseract.image_to_string(img, lang=ocr_lang)
                    if texto_ocr_pag.strip():
                        texto_acumulado.append(texto_ocr_pag.strip())

            doc.close()
        except Exception as e:
            logger.error(f"Error procesando PDF: {e}", exc_info=True)
            # Fallback si falla la lectura del PDF: intentar abrir como imagen directa
            try:
                img = Image.open(io.BytesIO(archivo_bytes))
                if img.mode not in ("RGB", "L"):
                    img = img.convert("RGB")
                texto_fallback = pytesseract.image_to_string(img, lang=ocr_lang)
                texto_acumulado.append(texto_fallback)
                metodo_usado = "pytesseract_fallback"
            except Exception as ex2:
                logger.error(f"Fallback OCR también falló: {ex2}")
                raise e
    else:
        metodo_usado = "pytesseract_imagen"
        try:
            img = Image.open(io.BytesIO(archivo_bytes))
            if img.mode not in ("RGB", "L"):
                img = img.convert("RGB")
            texto_ocr = pytesseract.image_to_string(img, lang=ocr_lang)
            texto_acumulado.append(texto_ocr)
        except Exception as e:
            logger.error(f"Error procesando imagen con pytesseract: {e}", exc_info=True)
            raise e

    texto_final = "\n".join(texto_acumulado).strip()
    return texto_final, metodo_usado


# =======================================================================
# Lógica de extracción genérica basada en texto (sin datos fijos/hardcoded)
# =======================================================================

def extraer_ddjj(texto):
    """
    1. DDJJ:
       - Patrón: r'DDJJ\s*(?:N[°º\.:]|NUMERO|NRO\.?)?\s*[:\s]*(?:DDJJ[-\s]*)?([0-9]{3,})' (case-insensitive).
       - Contempla saltos de línea y formatos variados.
       - Si no encuentra nada, devuelve estrictamente cadena vacía ("").
    """
    patron = re.search(
        r"DDJJ\s*(?:N[°º\.:]|NUMERO|NRO\.?)?\s*[:\s]*(?:DDJJ[-\s]*)?([0-9]{3,})",
        texto,
        re.IGNORECASE
    )
    if patron:
        return patron.group(1).strip()
    return ""


def extraer_nombre_apellido(texto):
    """
    2. NOMBRE Y APELLIDO:
       - La captura de nombre termina estrictamente antes del fin de línea ([^\n\r]+)
         o antes de etiquetas del sistema (CELULAR, TEL, DNI, DOMICILIO, etc.).
       - Algoritmo de división:
         * Si son 2 palabras: lista[0] es Nombre, lista[1] es Apellido.
         * Si son 3 o más palabras: ' '.join(lista[:-1]) son los Nombres, y lista[-1] es el Apellido.
         * Se descartan etiquetas reservadas si quedaran al inicio o al final.
    """
    palabras_reservadas = {
        "TITULAR", "DECLARANTE", "POSTULANTE", "SR", "SRA", "SR/SRA", "SEÑOR", "SEÑORA",
        "NOMBRE", "APELLIDO", "NOMBRES", "APELLIDOS", "CELULAR", "CEL", "TEL", "TELEFONO",
        "TELÉFONO", "MOVIL", "DNI", "DOC", "DOCUMENTO", "DOMICILIO", "DIRECCION",
        "DIRECCIÓN", "EMAIL", "CORREO", "FECHA", "DISCAPACIDAD", "INGRESOS", "ROL", "SEXO",
        "ESTADO", "DATOS", "PERSONALES", "DDJJ", "DECLARACION", "JURADA", "FORMULARIO",
        "FICHA", "EXPEDIENTE", "EXPTE", "INSTITUTO", "PROVINCIAL", "VIVIENDA", "URBANISMO", "IPVU"
    }

    def limpiar_y_extraer_palabras(linea_cruda):
        if not linea_cruda:
            return []
        # Tomar estrictamente la línea actual
        linea = linea_cruda.split("\n")[0].split("\r")[0]
        # Cortar estrictamente antes de cualquier etiqueta de sistema
        linea = re.split(
            r"\b(?:CELULAR|CEL|TEL[EÉ]FONO|TEL|MOVIL|DNI|DOC(?:UMENTO)?|DOMICILIO|DIRECCI[OÓ]N|EMAIL|FECHA|DISCAPACIDAD|INGRESOS|ROL|SEXO|DDJJ)\b",
            linea,
            flags=re.IGNORECASE
        )[0]
        # Conservar únicamente caracteres alfabéticos (con tildes, ñ) y espacios
        linea_limpia = re.sub(r"[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]", " ", linea)
        tokens = [t.strip() for t in linea_limpia.split() if t.strip()]
        # Descartar etiquetas o roles que hayan quedado al inicio, final o en la captura
        palabras_utiles = [t for t in tokens if t.upper() not in palabras_reservadas and len(t) > 1]
        return palabras_utiles

    # 1. Búsqueda con etiquetas prioritarias al inicio de línea (evitando títulos como 'DECLARACIÓN JURADA DE POSTULANTE')
    patron_prioritario = re.search(
        r"(?:^|[\n\r])\s*(?:(?<!DE\s)(?:NOMBRE\s+TITULAR|TITULAR|DECLARANTE|POSTULANTE|NOMBRE\s+Y\s+APELLIDO|APELLIDO\s+Y\s+NOMBRE))\s*[:\s]+([^\n\r]+)",
        texto,
        re.IGNORECASE
    )

    palabras = []
    if patron_prioritario:
        palabras = limpiar_y_extraer_palabras(patron_prioritario.group(1))

    # 2. Si no se encontró con etiqueta prioritaria, buscar etiquetas individuales por línea
    if not palabras:
        m_nom = re.search(r"(?:^|[\n\r])\s*(?:NOMBRES?|NOMBRE)\s*[:\s]+([^\n\r]+)", texto, re.IGNORECASE)
        m_ape = re.search(r"(?:^|[\n\r])\s*(?:APELLID[OA]S?|APELLID[OA])\s*[:\s]+([^\n\r]+)", texto, re.IGNORECASE)
        nom_palabras = limpiar_y_extraer_palabras(m_nom.group(1)) if m_nom else []
        ape_palabras = limpiar_y_extraer_palabras(m_ape.group(1)) if m_ape else []

        nombre = " ".join(nom_palabras).title() if nom_palabras else ""
        apellido = " ".join(ape_palabras).title() if ape_palabras else ""
        if nombre or apellido:
            return nombre[:40], apellido[:40]

    # Algoritmo de división genérico solicitado:
    if len(palabras) == 2:
        nombre = palabras[0].title()
        apellido = palabras[1].title()
    elif len(palabras) >= 3:
        nombre = " ".join(palabras[:-1]).title()
        apellido = palabras[-1].title()
    elif len(palabras) == 1:
        nombre = palabras[0].title()
        apellido = ""
    else:
        nombre = ""
        apellido = ""

    return nombre[:40], apellido[:40]


def extraer_dni(texto):
    """
    3. DNI:
       - r'(?:DNI(?:\\s+TITULAR)?|DOC(?:\\.?|UMENTO))\\s*[:\\s]*([0-9\\.\\s]{7,11})'
       - Sanitizar quitando puntos y espacios (re.sub(r'\\D', '', val)).
    """
    patron = re.search(
        r"(?:DNI(?:\s+TITULAR)?|DOC(?:\.?|UMENTO))\s*[:\s]*([0-9\.\s]{7,11})",
        texto,
        re.IGNORECASE
    )
    if patron:
        dni_limpio = re.sub(r"\D", "", patron.group(1))
        if 7 <= len(dni_limpio) <= 9:
            return dni_limpio
    return ""


def extraer_telefono(texto):
    """
    4. TELÉFONO / CELULAR:
       - r'(?:TEL(?:[EÉ]FONO)?|CEL(?:ULAR)?|MOVIL)\\s*[:\\s]*([\\d\\-\\s\\(\\)\\+]+)'
       - Limpiar guiones y espacios, conservando solo dígitos numéricos según las reglas del frontend.
       - Adecuar prefijos para cumplir el rango de 10 a 13 dígitos numéricos sin 0 ni 15.
    """
    patron = re.search(
        r"(?:TEL(?:[EÉ]FONO)?|CEL(?:ULAR)?|MOVIL)\s*[:\s]*([\d\-\s\(\)\+]+)",
        texto,
        re.IGNORECASE
    )
    if patron:
        digitos = re.sub(r"\D", "", patron.group(1))

        # Quitar prefijo de país 549 o 54 para celulares/fijos argentinos
        if digitos.startswith("549") and len(digitos) >= 13:
            digitos = digitos[3:]
        elif digitos.startswith("54") and len(digitos) > 10:
            digitos = digitos[2:]

        # Quitar 0 de código de área (ej: 0385... -> 385...)
        if digitos.startswith("0"):
            digitos = digitos[1:]

        # Quitar 15 de prefijo celular si está presente después del código de área
        if len(digitos) > 10 and "15" in digitos:
            for prefijo_len in [3, 4, 2]:
                if len(digitos) >= prefijo_len + 2 and digitos[prefijo_len:prefijo_len+2] == "15":
                    digitos_sin_15 = digitos[:prefijo_len] + digitos[prefijo_len+2:]
                    if 10 <= len(digitos_sin_15) <= 13:
                        digitos = digitos_sin_15
                        break

        if 10 <= len(digitos) <= 13:
            return digitos

    return ""


def extraer_domicilio(texto):
    """
    5. DOMICILIO:
       - r'(?:DOMICILIO(?:\\s+ACTUAL)?|DIRECCI[OÓ]N)\\s*[:\\s]+([^\\n\\r]+)'
       - Extraer la línea completa eliminando espacios en blanco innecesarios.
    """
    patron = re.search(
        r"(?:DOMICILIO(?:\s+ACTUAL)?|DIRECCI[OÓ]N)\s*[:\s]+([^\n\r]+)",
        texto,
        re.IGNORECASE
    )
    if patron:
        linea = patron.group(1).strip()
        # Cortar si se encuentra con otra etiqueta en la misma línea
        linea = re.split(r"\b(?:TEL|CEL|MOVIL|DNI|DOC|EMAIL|FECHA|LOCALIDAD|CP|PROVINCIA)\b", linea, flags=re.IGNORECASE)[0]
        linea = re.sub(r"\s+", " ", linea).strip(".-:,\t ")
        if len(linea) >= 4:
            return linea[:100]
    return ""


def extraer_email(texto):
    """
    6. EMAIL:
       - r'[\\w\\.-]+@[\\w\\.-]+\\.\\w+'
       - Si no se detecta coincidencia, devolver cadena vacía ("").
    """
    patron = re.search(r"[\w\.-]+@[\w\.-]+\.\w+", texto)
    if patron:
        return patron.group(0).strip()
    return ""


def extraer_discapacidad(texto):
    """
    7. DISCAPACIDAD:
       - En tablas u OCR, se descartan cabeceras de tabla adyacentes (como "INGRESOS", "ROL", "SEXO", "F.NAC", "TOTALES").
       - Valida estrictamente contra una lista cerrada de condiciones médicas o indicadores afirmativos ("SI", "SÍ", "POSEE").
       - Mapea por defecto a "Ninguna".
    """
    # Palabras de estructura del formulario o tabla que deben descartarse automáticamente
    palabras_estructura_tabla = {
        "INGRESOS", "INGRESO", "ROL", "SEXO", "F.NAC", "FNAC", "TOTALES", "TOTAL",
        "ESTADO", "EDAD", "PARENTESCO", "DOCUMENTO", "VINCULO", "VÍNCULO", "OBS", "OBSERVACIONES"
    }

    # Condiciones médicas válidas (lista cerrada)
    condiciones_medicas = [
        ("motriz", "Motriz"),
        ("visual", "Visual"),
        ("auditiva", "Auditiva"),
        ("intelectual", "Intelectual"),
        ("mental", "Mental"),
        ("visceral", "Visceral"),
        ("neurologica", "Neurológica"),
        ("neurológica", "Neurológica"),
        ("psicosocial", "Psicosocial"),
    ]

    patron = re.search(
        r"(?:DISCAPACIDAD|DISC(?:\.|\b)|POSEE\s+DISCAPACIDAD|TIENE\s+DISCAPACIDAD)\s*[:\s]+([^\n\r;]+)",
        texto,
        re.IGNORECASE
    )

    if patron:
        linea = patron.group(1).strip()
        # Si hay separadores de columna de tabla (| o tabulaciones), tomar solo el contenido de la columna actual
        columna = re.split(r"[\|\t]", linea)[0].strip()

        # Si el texto de la columna contiene alguna palabra de estructura o cabecera de tabla, descartar
        tokens = [t.upper().strip(".-:,") for t in columna.split()]
        if any(token in palabras_estructura_tabla for token in tokens):
            return "Ninguna"

        columna_lower = columna.lower()

        # 1. Indicadores negativos explícitos
        if any(re.search(r"\b" + neg + r"\b", columna_lower) for neg in ["no", "ninguna", "ningun", "sin", "false", "0"]):
            return "Ninguna"

        # 2. Condiciones médicas explícitas (lista cerrada)
        for clave, nombre_condicion in condiciones_medicas:
            if clave in columna_lower:
                return nombre_condicion

        # 3. Indicadores afirmativos explícitos
        if re.search(r"\b(?:s[ií]|posee|true|1)\b", columna_lower):
            return "SI"

    return "Ninguna"


def extraer_fecha_inscripcion(texto):
    """
    8. FECHA DE INSCRIPCIÓN:
       - r'FECHA\\s+(?:DE\\s+)?INSCRIPCI[OÓ]N\\s*[:\\s]*(\\d{1,2}[\\/\\-\\.]\\d{1,2}[\\/\\-\\.]\\d{2,4})'
       - Parsear y formatear a estándar YYYY-MM-DD para el input date.
    """
    patron = re.search(
        r"FECHA\s+(?:DE\s+)?INSCRIPCI[OÓ]N\s*[:\s]*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})",
        texto,
        re.IGNORECASE
    )
    if patron:
        cadena_fecha = patron.group(1)
        norm = re.sub(r"[\/\.]", "-", cadena_fecha)
        partes = norm.split("-")
        try:
            if len(partes[0]) == 4:
                # Formato ISO: YYYY-MM-DD
                año = int(partes[0])
                mes = int(partes[1])
                dia = int(partes[2])
            else:
                # Formato latinoamericano habitual: DD-MM-YYYY o DD-MM-YY
                dia = int(partes[0])
                mes = int(partes[1])
                año = int(partes[2])

            # Normalizar año de 2 dígitos (ej: 26 -> 2026)
            if año < 100:
                año += 2000

            dt = datetime(año, mes, dia)
            return dt.strftime("%Y-%m-%d")
        except Exception:
            pass

    return ""


# =======================================================================
# Función Principal de Procesamiento
# =======================================================================

def procesar_archivo_documento(archivo):
    """
    Recibe el archivo cargado en memoria desde Django request.FILES['documento'].
    Aplica PyMuPDF y pytesseract según corresponda, y extrae los campos requeridos
    de forma puramente dinámica a partir del texto analizado.
    """
    nombre_archivo = getattr(archivo, "name", "documento")
    archivo_bytes = archivo.read()

    try:
        archivo.seek(0)
    except Exception:
        pass

    # 1. Extraer texto crudo usando PyMuPDF y/o pytesseract
    texto_extraido, metodo_usado = extraer_texto_pymupdf_y_ocr(archivo_bytes, nombre_archivo=nombre_archivo)

    logger.info(f"Documento '{nombre_archivo}' procesado con método: {metodo_usado}. Caracteres leídos: {len(texto_extraido)}")

    # 2. Extraer campos estructurados sin valores hardcodeados ni fallbacks estáticos
    nombre, apellido = extraer_nombre_apellido(texto_extraido)
    ddjj = extraer_ddjj(texto_extraido)
    dni = extraer_dni(texto_extraido)
    telefono = extraer_telefono(texto_extraido)
    domicilio = extraer_domicilio(texto_extraido)
    email = extraer_email(texto_extraido)
    discapacidad = extraer_discapacidad(texto_extraido)
    fecha_inscripcion = extraer_fecha_inscripcion(texto_extraido)

    resultado = {
        "ddjj": ddjj,
        "nombre": nombre,
        "apellido": apellido,
        "dni": dni,
        "telefono": telefono,
        "domicilio_actual": domicilio,
        "email": email,
        "discapacidad": discapacidad,
        "fecha_inscripcion": fecha_inscripcion,
        "metodo": metodo_usado,
        "texto_extraido": texto_extraido[:1500],
    }

    return resultado
