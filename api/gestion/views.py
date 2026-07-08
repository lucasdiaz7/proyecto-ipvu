import csv
import os
import logging

from django.http import HttpResponse
from django.shortcuts import render
from rest_framework import viewsets, permissions
from .models import *
from .serializers import *
from .serializers import MiLoginPersonalizadoSerializer
from rest_framework_simplejwt.views import TokenObtainPairView
from .permissions import *
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.mixins import ListModelMixin, RetrieveModelMixin, CreateModelMixin, UpdateModelMixin
from rest_framework.viewsets import GenericViewSet
from django.contrib.auth.models import User
from rest_framework.views import APIView
from rest_framework_simplejwt.authentication import JWTAuthentication
from django.conf import settings
from django.core.mail import send_mail
from django.contrib.auth.tokens import default_token_generator
from django.db.models import Count
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode
from django.db.models import Q
from django.db.models import Count
from rest_framework.throttling import ScopedRateThrottle
from rest_framework_simplejwt.views import TokenRefreshView
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.lib.units import cm
from django.core.exceptions import ObjectDoesNotExist
from django.http import HttpResponse
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable, PageBreak
)
from reportlab.lib import colors

logger = logging.getLogger(__name__)




# Notificaciones automaticas. meensajes posibles al recibir un expediente
MENSAJE_NUEVO_CASO = "Nuevo caso recibido"
MENSAJE_CASO_RECIBIDO = "Caso recibido"
ROLES_CON_NOTIFICACION_DE_CASO = ['TS', 'LG']


# verifica si el usuario destino pertenece a un rol que debe recibir notificaciones de expedientes, o sea, LG y TS
def usuario_puede_recibir_notificacion_caso(usuario_destino):
    if not usuario_destino:
        return False

    perfil_destino = getattr(usuario_destino, 'usuario', None)

    if not perfil_destino:
        return False

    return perfil_destino.rol.nombre_rol in ROLES_CON_NOTIFICACION_DE_CASO


# determina si el usuario ya habia recibido antes el mismo expediente para que el la notificacion no diga NUEVO
# se revisan notificaciones previas y pases anteriores el pase actual se excluye para no contarlo como antecedente 
def usuario_recibio_expediente_antes(usuario_destino, expediente, pase_actual=None):
    notificacion_previa = Notificacion.objects.filter(
        usuario_destino=usuario_destino,
        expediente_relacionado=expediente
    ).exists()

    pases_previos = HistorialPase.objects.filter(
        expediente=expediente,
        usuario_destino=usuario_destino
    )
    # evita contar el pase actual como un pase previo
    if pase_actual:
        pases_previos = pases_previos.exclude(id=pase_actual.id)

    return notificacion_previa or pases_previos.exists()


# crea la notificacion cuando un usuario de TS o Legales recibe un expediente
# si es la primera vez q recibe muestra Nuevo caso recibido. si ya lo recibio antes muestra Caso recibido
def crear_notificacion_recepcion_expediente(usuario_destino, expediente, pase_actual=None):
    if not usuario_puede_recibir_notificacion_caso(usuario_destino):
        return

    recibio_antes = usuario_recibio_expediente_antes(
        usuario_destino=usuario_destino,
        expediente=expediente,
        pase_actual=pase_actual
    )

    mensaje = MENSAJE_CASO_RECIBIDO if recibio_antes else MENSAJE_NUEVO_CASO

    Notificacion.objects.create(
        mensaje=mensaje,
        usuario_destino=usuario_destino,
        expediente_relacionado=expediente
    )


class PostulanteTitularViewSet(viewsets.ModelViewSet):
    queryset = PostulanteTitular.objects.all()
    serializer_class = PostulanteTitularSerializer

    def perform_create(self, serializer):   
        ddjj = serializer.validated_data.pop('ddjj')
        postulante = serializer.save()
        estado_inicial = EstadoExpediente.objects.get(nombre='SINI')
        trabajadora_social = obtener_siguiente_trabajadora_social()
        # crea el expediente inicial y conserva la instancia para generar la notificacion al usuario asignado
        expediente = Expediente.objects.create(
            postulante_titular=postulante,
            estado_expediente=estado_inicial,
            DDJJ=ddjj,
            usuario_asignado=trabajadora_social
        )
        # notifica a la trabajadora social cuando recibe el expediente por primera vez
        crear_notificacion_recepcion_expediente(trabajadora_social, expediente)

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update']:
            return [IsDataEntryOrSuperAdmin()]
        if self.action == 'destroy':
            return [IsSuperAdmin()]
        return [IsAnyRole()]
    

 
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update']:
            return [IsDataEntryOrSuperAdmin()]
        if self.action == 'destroy':
            return [IsSuperAdmin()]
        return [IsAnyRole()]
 
class EstadoExpedienteViewSet(ListModelMixin, RetrieveModelMixin, GenericViewSet, UpdateModelMixin):
    queryset = EstadoExpediente.objects.all()
    permission_classes = [IsAnyRole]
    serializer_class = EstadoExpedienteSerializer



def obtener_siguiente_trabajadora_social():
    trabajadoras = list(
        User.objects
        .filter(usuario__rol__nombre_rol="TS")
        .order_by("id")
    )

    if not trabajadoras:
        return None

    ultimo_expediente = (
        Expediente.objects
        .filter(usuario_asignado__usuario__rol__nombre_rol="TS", usuario__activo= True)
        .order_by("-id")
        .first()
    )

    if not ultimo_expediente or not ultimo_expediente.usuario_asignado:
        return trabajadoras[0]

    ultimo_usuario = ultimo_expediente.usuario_asignado

    try:
        indice_actual = trabajadoras.index(ultimo_usuario)
    except ValueError:
        return trabajadoras[0]

    siguiente_indice = indice_actual + 1

    if siguiente_indice >= len(trabajadoras):
        siguiente_indice = 0

    return trabajadoras[siguiente_indice]

class ExpedienteViewSet(viewsets.ModelViewSet,):
    queryset = Expediente.objects.all().order_by('-id')[:5]
    serializer_class = ExpedienteSerializer

    def perform_create(self, serializer):
        trabajadora_social = obtener_siguiente_trabajadora_social()
        # Guarda el expediente creado manualmente y conserva la instancia para notificar al usuario asignado.
        expediente = serializer.save(usuario_asignado=trabajadora_social)
        # Notifica a la Trabajadora Social cuando recibe el expediente creado desde este endpoint.
        crear_notificacion_recepcion_expediente(trabajadora_social, expediente)

    def get_queryset(self):
        usuario = self.request.user
        
        buscar = self.request.query_params.get('buscar')
        estado = self.request.query_params.get('estado')
        dni = self.request.query_params.get('dni') 
        dni_inicio = self.request.query_params.get('dni_inicio' ) 
        dni_fin = self.request.query_params.get('dni_fin' ) 
        dni_contiene = self.request.query_params.get('dni_contiene')
           
        usuario_asignado = self.request.query_params.get('usuario_asignado')

        
        if not usuario.is_authenticated:
            queryset = Expediente.objects.all()
        elif hasattr(usuario, 'usuario') and usuario.usuario.rol.nombre_rol in ['TS', 'LG', 'DE']:
            queryset = Expediente.objects.filter(usuario_asignado= usuario)
        else:
            queryset = Expediente.objects.all()

        if buscar:
            palabras = buscar.split()
            for palabra in palabras:
                queryset = queryset.filter(
                    Q(postulante_titular__nombre__icontains=palabra)|
                    Q(postulante_titular__apellido__icontains=palabra)
                )

        if estado:
            queryset = queryset.filter(estado_expediente__nombre = estado)
            
        if dni:
            queryset = queryset.filter(postulante_titular__dni = dni)
        
        if dni_inicio:
            queryset = queryset.filter(postulante_titular__dni__startswith=dni_inicio)

        if dni_fin:
            queryset = queryset.filter(postulante_titular__dni__endswith=dni_fin)

        if dni_contiene:
         queryset = queryset.filter(postulante_titular__dni__contains=dni_contiene)
            
        if usuario_asignado:
            queryset = queryset.filter(usuario_asignado = usuario_asignado)
            
        return queryset   
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update']:
            return [IsDataEntry()]
        if self.action in ['destroy']:
            return [IsSuperAdmin()]
        return [IsAnyRole()]    

    @action(detail=False, methods=['get'], url_path='reporte-estados')
    def reporte_estados(self, request):
        conteos = (
            Expediente.objects
            .values('estado_expediente__nombre')
            .annotate(cantidad=Count('id'))
        )

        conteos_por_estado = {
            item['estado_expediente__nombre']: item['cantidad']
            for item in conteos
        }

        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="reporte_estados_expedientes.csv"'

        writer = csv.writer(response)
        writer.writerow(['Estado', 'Cantidad'])

        estados = dict(EstadoExpediente.tipo_estado)
        for codigo_estado, nombre_estado in estados.items():
            writer.writerow([nombre_estado, conteos_por_estado.get(codigo_estado, 0)])

        return response
    
    
    @action(detail=True, methods=['patch'], permission_classes=[IsDataEntry])
    def cambiar_estado(self, request, pk=None):
        print("\n--- 🟢 ENTRÓ A LA FUNCIÓN CAMBIAR ESTADO ---")
        print(f"Data cruda recibida del Front: {request.data}")
        
        try:
            expediente = self.get_object()
            nuevo_estado = request.data.get('estado')
            print(f"Estado extraído: {nuevo_estado}")
            
            if nuevo_estado in ['AP', 'NOAP', 'NUEVAV']:
                # 2. Intentamos buscar el estado en la base de datos
                estado_obj = EstadoExpediente.objects.get(nombre=nuevo_estado)
                print(f"Objeto estado encontrado en DB: {estado_obj}")
                
                # 3. Asignamos y guardamos
                expediente.estado_expediente = estado_obj
                expediente.save()
                print("--- ✅ ÉXITO: Expediente guardado en DB ---")
                
                return Response({'mensaje': 'Estado actualizado'}, status=200)
            else:
                print("--- 🟡 ADVERTENCIA: Cayó en el else (estado no válido) ---")
                return Response({'error': 'Estado no válido'}, status=400)
                
        except EstadoExpediente.DoesNotExist:
            print(f"--- 🔴 ERROR: El estado '{nuevo_estado}' NO EXISTE en tu tabla EstadoExpediente ---")
            return Response({'error': 'El estado no existe en la base de datos. Crealo primero.'}, status=404)
            
        except Exception as e:
            print(f"--- 🔴 ERROR FATAL: {str(e)} ---")
            return Response({'error': str(e)}, status=500)
        
        
        
class RolViewSet(ListModelMixin, RetrieveModelMixin, GenericViewSet):
    queryset = Rol.objects.all()
    permission_classes = [IsAnyRole]
    serializer_class = RolSerializer
    
class UsuarioViewSet(viewsets.ModelViewSet):
    queryset = Usuario.objects.all()
    serializer_class = UsuarioSerializer
    
    def get_permissions(self):
        if self.action in ['create', 'destroy', 'update', 'partial_update']:
            return [IsSuperAdmin()]
        return [IsAnyRole()]
    
    def get_queryset(self):
        queryset = Usuario.objects.all()
        rol= self.request.query_params.get('rol')

        if rol:
            queryset = queryset.filter(rol__nombre_rol=rol)
            
        return queryset
    
    @action(detail=False, methods=['get'])
    def auditoria_usuarios(self, request):
        try:
            perfiles = self.get_queryset() 
            
            #filtro para mostrar solo trabajadoras sociales
            solo_ts = request.query_params.get('solo_ts')
            if solo_ts == 'true':
                perfiles = perfiles.filter(rol__nombre_rol= 'TS')
                
            resultado = []

            for perfil in perfiles:
                user_nativo = perfil.usuario
                expedientes_del_usuario = user_nativo.expediente_set.all()
                
                total_asignados = expedientes_del_usuario.count()
                total_vistos = expedientes_del_usuario.filter(visto=True).count()

                desglose_db = expedientes_del_usuario.values('estado_expediente__nombre').annotate(cantidad=Count('id'))

                estados_limpios = {}
                for item in desglose_db:
                    codigo_estado = item['estado_expediente__nombre']
                    clave = codigo_estado if codigo_estado else "Sin estado"
                    estados_limpios[clave] = item['cantidad']

                resultado.append({
                    "usuario_id": perfil.id,
                    "nombre_completo": f"{perfil.apellido}, {perfil.nombre}",
                    "rol": perfil.rol.nombre_rol if perfil.rol else "Sin Rol",
                    "total_asignados": total_asignados,
                    "total_vistos": total_vistos,
                    "desglose_estados": estados_limpios
                })
            return Response(resultado)
        
        except Exception as e:
            import traceback
            return Response({"error_fatal": f"Error: {str(e)}",
                "detalle": traceback.format_exc()
            }, status=500)
        
        
class DocumentoAdjuntoViewSet(viewsets.ModelViewSet):
    queryset = DocumentoAdjunto.objects.all()
    permission_classes = [IsAnyRole]
    serializer_class = DocumentoAdjuntoSerializer   
    
    def perform_create(self, serializer):
        serializer.save(subido_por = self.request.user)
    
    def get_queryset(self):
        queryset = DocumentoAdjunto.objects.all()
        expediente_id = self.request.query_params.get('expediente')
        
        if expediente_id:
            queryset = queryset.filter(expediente_id=expediente_id)
            
        return queryset
    
    def perform_destroy(self, instance):
        archivo = instance.archivo
        instance.delete()
        
        if archivo:
            archivo.delete(save=False)
    
             


class HistorialPaseViewSet(ListModelMixin, RetrieveModelMixin, CreateModelMixin, GenericViewSet):
    queryset = HistorialPase.objects.all()
    permission_classes = [IsAnyRole]
    serializer_class = HistorialPaseSerializer
    
    def perform_create(self, serializer):
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
            expediente.save()

        # Notifica al usuario destino cuando recibe el expediente por pase.
        # Si ya lo habia recibido antes, el helper usa el mensaje "Caso recibido".
        crear_notificacion_recepcion_expediente(pase.usuario_destino, expediente, pase_actual=pase)
        
    def get_queryset(self):
        queryset = (
            HistorialPase.objects
            .select_related(
                'expediente',
                'expediente__estado_expediente',
                'expediente__postulante_titular',
                'expediente__usuario_asignado',
                'expediente__usuario_asignado__usuario',
                'usuario_origen',
                'usuario_origen__usuario',
                'usuario_destino',
                'usuario_destino__usuario',
            )
            .prefetch_related('documentos_adjuntos')
        )
        expediente_id = self.request.query_params.get('expediente')
        usuario_id = self.request.query_params.get('usuario')
        
        if expediente_id is not None:
            queryset = queryset.filter(expediente_id=expediente_id)

        if usuario_id:
            queryset = queryset.filter(
                Q(usuario_origen_id=usuario_id) |
                Q(usuario_destino_id=usuario_id)
            )
            
        return queryset

        
            
class NotificacionViewSet(viewsets.ModelViewSet):
    queryset = Notificacion.objects.all()
    serializer_class = NotificacionSerializer

    # Devuelve solo las notificaciones del usuario autenticado, ordenadas desde la mas reciente.
    def get_queryset(self):
        return Notificacion.objects.filter(
            usuario_destino=self.request.user
        ).order_by('-fecha_creacion')

    def get_permissions(self):
        if self.action == 'create':
            return [IsSuperAdmin()]
        return [IsAnyRole()]

    # Permite que el frontend marque como leida una notificacion ya mostrada al usuario.
    @action(detail=True, methods=['patch'], url_path='marcar-leida')
    def marcar_leida(self, request, pk=None):
        notificacion = self.get_object()
        notificacion.leida = True
        notificacion.save(update_fields=['leida'])
        return Response({'mensaje': 'Notificacion marcada como leida'})

class HistorialAccionViewSet(ListModelMixin, RetrieveModelMixin, GenericViewSet):
    queryset = HistorialAccion.objects.all()
    permission_classes = [IsAnyRole]
    serializer_class = HistorialAccionSerializer



import os
from django.conf import settings

import os
from django.conf import settings

def _dibujar_encabezado_pie_formulario(canvas, doc):
    canvas.saveState()
    ancho_pagina, alto_pagina = A4

    # --- Rutas de los logos ---
    logo_ipvu_path = os.path.join(
        settings.BASE_DIR, "gestion", "static_pdf", "logo_ipvu.jpg"
    )
    logo_santiago_path = os.path.join(
        settings.BASE_DIR, "gestion", "static_pdf", "logo_santiago.jpg"
    )

    # --- Logo izquierdo (I.P.V.U.) ---
    if os.path.exists(logo_ipvu_path):
        canvas.drawImage(
            logo_ipvu_path,
            x=2 * cm, y=alto_pagina - 2.3 * cm,
            width=2 * cm, height=1.6 * cm,
            preserveAspectRatio=True, mask='auto'
        )
    else:
        logger.warning(f"No se encontró el logo IPVU en: {logo_ipvu_path}")

    # --- Logo derecho (Santiago) ---
    if os.path.exists(logo_santiago_path):
        canvas.drawImage(
            logo_santiago_path,
            x=ancho_pagina - 4 * cm, y=alto_pagina - 2.3 * cm,
            width=2 * cm, height=1.6 * cm,
            preserveAspectRatio=True, mask='auto'
        )
    else:
        logger.warning(f"No se encontró el logo Santiago en: {logo_santiago_path}")

    # --- Encabezado institucional (3 líneas centradas) ---
    y = alto_pagina - 1.3 * cm
    canvas.setFont("Helvetica-Bold", 10)
    canvas.drawCentredString(ancho_pagina / 2, y, "INSTITUTO PROVINCIAL DE VIVIENDA Y URBANISMO")
    y -= 0.42 * cm
    canvas.drawCentredString(ancho_pagina / 2, y, "Ministerio de Obras y Servicios Públicos")
    y -= 0.42 * cm
    canvas.drawCentredString(ancho_pagina / 2, y, "SECRETARÍA TÉCNICA DE RELACIONES PUBLICAS E INSTITUCIONALES")

    # --- Fila de contacto ---
    y -= 0.35 * cm
    canvas.setLineWidth(0.5)
    canvas.line(2 * cm, y, ancho_pagina - 2 * cm, y)
    y -= 0.45 * cm
    canvas.setFont("Helvetica-Bold", 8)
    canvas.drawCentredString(ancho_pagina * 0.20, y, "Agustín Álvarez N° 90")
    canvas.drawCentredString(ancho_pagina * 0.50, y, "Tel. (0385) 422-1646 / 4989")
    canvas.drawCentredString(ancho_pagina * 0.80, y, "4200 - Santiago del Estero")
    y -= 0.25 * cm
    canvas.line(2 * cm, y, ancho_pagina - 2 * cm, y)

    # --- Pie de página ---
    canvas.setFont("Helvetica-Oblique", 7)
    canvas.drawCentredString(
        ancho_pagina / 2, 1.3 * cm,
        "Secretaría Técnica de Relaciones Públicas - I.P.V.U. - "
        "Lunes a Viernes de 8 a 12 hs. - Santiago del Estero"
    )
    if canvas.getPageNumber() == 1:
       y_firma = 3.8 * cm

       canvas.setLineWidth(0.7)
       canvas.line(6 * cm, y_firma, 15 * cm, y_firma)

       canvas.setFont("Helvetica", 9)
       canvas.drawCentredString(
          ancho_pagina / 2,
          y_firma - 0.5 * cm,
           "Firma y Aclaración del Entrevistado"
         )
    canvas.restoreState()
    
class FormularioSocioHabitacionalViewSet(ListModelMixin, RetrieveModelMixin, CreateModelMixin, UpdateModelMixin, GenericViewSet):
    queryset = FormularioSocioHabitacional.objects.all()
    serializer_class = FormularioSocioHabitacionalSerializer
    
    def get_queryset(self):
        queryset = FormularioSocioHabitacional.objects.all()
        expediente_id = self.request.query_params.get('expediente') 
        
        if expediente_id:
            queryset = queryset.filter(expediente_id = expediente_id)
            
        return queryset
            
    
    def perform_create(self, serializer):
        formulario = serializer.save()
        expediente = formulario.expediente
        estado_1v = EstadoExpediente.objects.get(nombre='1V')
        expediente.estado_expediente = estado_1v
        expediente.save()

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update']:
            return [IsTrabajadoraSocial()]
        return [IsAnyRole()]


    @action(detail=True, methods=['get'], url_path='pdf')
    def generar_pdf(self, request, pk=None):
        formulario = self.get_object()
        expediente = formulario.expediente

        # --- Datos del profesional asignado ---
        profesional = ""
        if expediente.usuario_asignado:
            try:
                perfil = expediente.usuario_asignado.usuario
                profesional = f"{perfil.apellido}, {perfil.nombre} (Mat. {perfil.matricula})"
            except (AttributeError, ObjectDoesNotExist) as e:
                logger.warning(
                    f"No se pudo obtener perfil detallado para usuario_asignado "
                    f"id={expediente.usuario_asignado_id}: {e}"
                )
                profesional = (
                    f"{expediente.usuario_asignado.last_name}, "
                    f"{expediente.usuario_asignado.first_name}"
                )

        # --- Datos del titular ---
        domicilio = apellido = nombre = dni = ""
        if expediente.postulante_titular:
            titular = expediente.postulante_titular
            domicilio = getattr(titular, 'domicilio_actual', '') or ''
            apellido = getattr(titular, 'apellido', '') or ''
            nombre = getattr(titular, 'nombre', '') or ''
            dni = getattr(titular, 'dni', '') or ''

        # --- Fecha ---
        fecha = formulario.fecha_modificacion or formulario.fecha_creacion
        meses = [
            "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
            "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
        ]
        dia_str = mes_str = anio_str = ""
        if fecha:
            dia_str = str(fecha.day)
            mes_str = meses[fecha.month - 1]
            anio_str = str(fecha.year)[-2:]

        response = HttpResponse(content_type='application/pdf')
        response['Content-Disposition'] = (
            f'attachment; filename="Formulario_{formulario.id}.pdf"'
        )

        doc = SimpleDocTemplate(
            response,
            pagesize=A4,
            topMargin=3.6 * cm,
            bottomMargin=2.2 * cm,
            leftMargin=2 * cm,
            rightMargin=2 * cm,
        )
        
        doc.title = f"Informe Socio Habitacional - Expediente {expediente_id}"

        styles = getSampleStyleSheet()
        styles.add(ParagraphStyle(name='TituloFormulario', parent=styles['Heading1'],
                                   alignment=TA_CENTER, fontSize=13, spaceBefore=6, spaceAfter=14))
        styles.add(ParagraphStyle(name='CampoIdentificacion', parent=styles['Normal'],
                                   fontSize=10, spaceAfter=8))
        styles.add(ParagraphStyle(name='SeccionTitulo', parent=styles['Heading2'],
                                   fontSize=11, spaceBefore=10, spaceAfter=2, textColor=colors.black))
        styles.add(ParagraphStyle(name='SeccionBajada', parent=styles['Normal'],
                                   fontName='Helvetica-Oblique', fontSize=8.5,
                                   textColor=colors.grey, spaceAfter=6))
        styles.add(ParagraphStyle(name='TextoCuerpo', parent=styles['Normal'],
                                   fontSize=10, leading=14, spaceAfter=4))
        styles.add(ParagraphStyle(name='FirmaLinea', parent=styles['Normal'],
                                   alignment=TA_CENTER, fontSize=10, spaceBefore=24))
        styles.add(ParagraphStyle(name='FirmaEtiqueta', parent=styles['Normal'],
                                   alignment=TA_CENTER, fontSize=9, spaceBefore=2))
        styles.add(ParagraphStyle(name='TextoCaja', parent=styles['Normal'], fontSize=10, leading=14))
        elementos = []

        def agregar_seccion(titulo, bajada, contenido):
            elementos.append(Paragraph(titulo, styles['SeccionTitulo']))

            if bajada:
                elementos.append(Paragraph(bajada, styles['SeccionBajada']))

            texto = (contenido or "-").replace("\n", "<br/>")

            tabla = Table(
                [[Paragraph(texto, styles['TextoCaja'])]],
                   colWidths=[16.5 * cm]
                    )

            tabla.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, -1), colors.whitesmoke),
                ("BOX", (0, 0), (-1, -1), 0.5, colors.lightgrey),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
              ]))

            elementos.append(tabla)
            elementos.append(Spacer(1, 8))

        # ============ pagina 1 ============
        elementos.append(Paragraph("INFORME SOCIO HABITACIONAL", styles['TituloFormulario']))
        elementos.append(Paragraph(f"<b>Profesional Actuante:</b> {profesional or '-'}", styles['CampoIdentificacion']))
        elementos.append(Paragraph(
            f"<b>Caso de Referencia:</b> Expediente N° {expediente.id} &nbsp;&nbsp;&nbsp; "
            f"<b>DJ N°:</b> {expediente.DDJJ or '-'}",
            styles['CampoIdentificacion']
        ))
        elementos.append(Paragraph(
            f"<b>Domicilio:</b> {domicilio or '-'} "
            f"(Titular: {apellido}, {nombre} - DNI: {dni or '-'})",
            styles['CampoIdentificacion']
        ))
        elementos.append(Spacer(1, 6))

        agregar_seccion("GRUPO FAMILIAR CONSTITUYENTE", "Tipo y Dinamia familiar. Conflictos", formulario.grupo_familiar)
        agregar_seccion("SITUACIÓN HABITACIONAL", "Tipo de posesión y tiempo de habitabilidad", formulario.situacion_habitacional)
        agregar_seccion("ASPECTO ECONÓMICO", "Ingresos y Calidad de Vida", formulario.aspecto_economico)
        agregar_seccion("SITUACIÓN DE SALUD", "Discapacidad. Invalidez", formulario.situacion_salud)
        agregar_seccion("NIVEL DE ESTUDIOS", None, formulario.nivel_estudios)

        agregar_seccion("SITUACIÓN DE SALUD", "Discapacidad. Invalidez", formulario.situacion_salud)
        agregar_seccion("NIVEL DE ESTUDIOS", None, formulario.nivel_estudios)

          # La firma ahora se dibuja desde _dibujar_encabezado_pie_formulario()

        # ============  pagina 2============

        elementos.append(PageBreak())

        agregar_seccion("RELEVAMIENTO VECINAL", None, formulario.relevamiento_vecinal)


        agregar_seccion("OBSERVACIONES Y/O PARTICULARIDADES", None, formulario.observaciones)

        elementos.append(Spacer(1, 16))
        elementos.append(Paragraph(
            f"Santiago del Estero, {dia_str or '____'} de {mes_str or '____________'} de 20{anio_str or '__'}",
            styles['TextoCuerpo']
        ))
        elementos.append(Spacer(1, 10))
        elementos.append(Paragraph("Atentamente", styles['TextoCuerpo']))
        elementos.append(Spacer(1, 24))
        elementos.append(Paragraph("_" * 40, styles['FirmaLinea']))
        elementos.append(Paragraph("Firma y Sello del Profesional Actuante", styles['FirmaEtiqueta']))

        doc.build(
            elementos,
            onFirstPage=_dibujar_encabezado_pie_formulario,
            onLaterPages=_dibujar_encabezado_pie_formulario,
        )
        return response
    
    
class MiLoginPersonalizadoView(TokenObtainPairView):
    serializer_class = MiLoginPersonalizadoSerializer
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "login"


class EstablecerPasswordInicialView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = EstablecerPasswordInicialSerializer(
            data=request.data,
            context={"request": request}
        )

        serializer.is_valid(raise_exception=True)    
        serializer.save()

        return Response({"mensaje": "Contraseña actualizada correctamente"})

class SolicitarResetPasswordView(APIView):
    permission_classes = [permissions.AllowAny]
    throttle_classes =[ScopedRateThrottle]
    throttle_scope = "password_reset"

    def post(self, request):
        serializer = SolicitarResetPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data["email"]
        usuario = User.objects.filter(email=email).first()

        if usuario:
            uid = urlsafe_base64_encode(force_bytes(usuario.pk))
            token = default_token_generator.make_token(usuario)
            reset_link = f"{settings.FRONTEND_URL}/reset-password/{uid}/{token}/"

            send_mail(
                subject="Restablecer contraseña",
                message=(
                    "Recibimos una solicitud para restablecer tu password.\n\n"
                    f"Usa este enlace para crear una password nueva:\n{reset_link}\n\n"
                    "Si no solicitaste este cambio, puedes ignorar este mensaje."
                ),
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[usuario.email],
                fail_silently=False,
            )

        return Response({
            "mensaje": "Si el email existe, se enviaron instrucciones para resetear la contraseña."
        })


class ConfirmarResetPasswordView(APIView):
    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "password_reset"
    def post(self, request):
        serializer = ConfirmarResetPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response({
            "mensaje": "Contraseña actualizada correctamente."
        })


class MiTokenRefreshView(TokenRefreshView):
    
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "token_refresh"
