from types import SimpleNamespace
from unittest.mock import patch

import requests
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import SimpleTestCase
from rest_framework.test import APIRequestFactory, force_authenticate

from . import ia_client
from .views import ProcesarDocumentoView

# Create your tests here.
# hola a todos

# respuesta real del microservicio de IA (v2.0.0) para una DDJJ de prueba
RESPUESTA_IA = {
    "numero_ddjj": "12345",
    "nombre": "Carlos Morales",
    "apellido": None,
    "dni": "34567890",
    "telefono": None,
    "domicilio_actual": "Calle Libertad 742",
    "email": None,
    "discapacidad": "NO",
    "fecha_inscripcion": "15/04/2023",
}


def usuario_con_rol(nombre_rol):
    # usuario en memoria con la forma que espera permissions.usuario_tiene_rol, sin tocar la base
    return SimpleNamespace(
        is_authenticated=True,
        is_active=True,
        usuario=SimpleNamespace(rol=SimpleNamespace(nombre_rol=nombre_rol), requiere_cambio_password=False),
    )


def respuesta_http(status_code, json_data=None):
    response = requests.Response()
    response.status_code = status_code
    response._content = requests.compat.json.dumps(json_data).encode() if json_data is not None else b''
    return response


class NormalizarDatosDDJJTests(SimpleTestCase):

    def test_traduce_campos_al_formulario(self):
        datos = ia_client.normalizar_datos_ddjj(RESPUESTA_IA)
        self.assertEqual(datos, {
            'ddjj': '12345',
            'nombre': 'Carlos Morales',
            'apellido': None,
            'dni': '34567890',
            'telefono': None,
            'domicilio_actual': 'Calle Libertad 742',
            'email': None,
            'discapacidad': 'NO',
            'fecha_inscripcion': '2023-04-15',
        })

    def test_acepta_formatos_de_fecha(self):
        for valor, esperado in [
            ('15/04/2023', '2023-04-15'),
            ('15-04-2023', '2023-04-15'),
            ('15.4.23', '2023-04-15'),
            ('2023-04-15', '2023-04-15'),
            ('31/02/2023', None),
            ('sin fecha', None),
            ('', None),
            (None, None),
        ]:
            with self.subTest(valor=valor):
                self.assertEqual(ia_client._fecha_iso(valor), esperado)

    def test_limpia_dni_y_acepta_nombre_alternativo(self):
        datos = ia_client.normalizar_datos_ddjj({'dni_titular': '34.567.890'})
        self.assertEqual(datos['dni'], '34567890')

    def test_textos_vacios_quedan_en_none(self):
        datos = ia_client.normalizar_datos_ddjj({'nombre': '   ', 'domicilio_actual': ''})
        self.assertIsNone(datos['nombre'])
        self.assertIsNone(datos['domicilio_actual'])


@patch('gestion.ia_client.requests.post')
class ProcesarDocumentoViewTests(SimpleTestCase):

    def setUp(self):
        self.factory = APIRequestFactory()
        self.view = ProcesarDocumentoView.as_view()

    def enviar(self, archivo=None, rol='DE'):
        data = {'documento': archivo} if archivo is not None else {}
        request = self.factory.post('/api/procesar-documento/', data, format='multipart')
        force_authenticate(request, user=usuario_con_rol(rol))
        return self.view(request)

    def pdf(self, nombre='ddjj.pdf'):
        return SimpleUploadedFile(nombre, b'%PDF-1.4 contenido', content_type='application/pdf')

    def test_devuelve_datos_traducidos(self, mock_post):
        mock_post.return_value = respuesta_http(200, RESPUESTA_IA)
        response = self.enviar(self.pdf())

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['ddjj'], '12345')
        self.assertEqual(response.data['fecha_inscripcion'], '2023-04-15')
        # el archivo viaja al microservicio en el campo 'archivo'
        nombre, contenido, _ = mock_post.call_args.kwargs['files']['archivo']
        self.assertEqual((nombre, contenido), ('ddjj.pdf', b'%PDF-1.4 contenido'))

    def test_rechaza_roles_sin_permiso(self, mock_post):
        response = self.enviar(self.pdf(), rol='TS')
        self.assertEqual(response.status_code, 403)
        mock_post.assert_not_called()

    def test_valida_archivo_antes_de_llamar_a_ia(self, mock_post):
        self.assertEqual(self.enviar().status_code, 400)
        self.assertEqual(self.enviar(self.pdf('planilla.xlsx')).status_code, 400)
        mock_post.assert_not_called()

    def test_ia_caida_responde_503(self, mock_post):
        mock_post.side_effect = requests.ConnectionError()
        response = self.enviar(self.pdf())
        self.assertEqual(response.status_code, 503)
        self.assertIn('No se pudo conectar', response.data['error'])

    def test_ia_lenta_responde_503(self, mock_post):
        mock_post.side_effect = requests.Timeout()
        self.assertEqual(self.enviar(self.pdf()).status_code, 503)

    def test_ia_rechaza_archivo_responde_400_con_su_mensaje(self, mock_post):
        mock_post.return_value = respuesta_http(400, {'detail': 'El archivo enviado se encuentra vacío (0 bytes).'})
        response = self.enviar(self.pdf())
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.data['error'], 'El archivo enviado se encuentra vacío (0 bytes).')

    def test_error_interno_de_ia_responde_502(self, mock_post):
        mock_post.return_value = respuesta_http(500, {'detail': 'Fallo de OCR'})
        self.assertEqual(self.enviar(self.pdf()).status_code, 502)


# ---------------------------------------------------------------------------
# Seguridad: documentos adjuntos, permisos por defecto y tokens.
# Corren contra una base SQLite temporal (ver settings.py) y una carpeta media temporal.
# ---------------------------------------------------------------------------

import shutil
import tempfile
from datetime import timedelta

from django.contrib.auth.models import User
from django.core.cache import cache
from django.test import TestCase, override_settings
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import AccessToken

from .models import (
    DocumentoAdjunto, EstadoExpediente, Expediente, HistorialAccion, Notificacion, PostulanteTitular, Rol, Usuario,
)

MEDIA_TEMPORAL = tempfile.mkdtemp()


@override_settings(MEDIA_ROOT=MEDIA_TEMPORAL)
class SeguridadBaseTestCase(TestCase):

    @classmethod
    def tearDownClass(cls):
        super().tearDownClass()
        shutil.rmtree(MEDIA_TEMPORAL, ignore_errors=True)

    def setUp(self):
        # los limites de intentos (5 logins por minuto) se guardan en cache: se limpian en cada test
        cache.clear()
        self.client = APIClient()

        self.user_de = self.crear_usuario('dataentry', 'DE')
        self.user_sin_perfil = User.objects.create_user('sinperfil', password='ClaveSegura123!')

        postulante = PostulanteTitular.objects.create(
            nombre='Ana', apellido='Gomez', telefono='3850000000', dni='30111222', domicilio_actual='Calle 1',
        )
        estado = EstadoExpediente.objects.create(nombre='SINI')
        # DE/TS/LG solo ven los expedientes que tienen asignados
        self.expediente = Expediente.objects.create(
            postulante_titular=postulante, estado_expediente=estado, usuario_asignado=self.user_de,
        )

        self.documento = DocumentoAdjunto.objects.create(
            tipo_documento='DNI',
            archivo=SimpleUploadedFile('dni.pdf', b'%PDF-1.4 dni de prueba', content_type='application/pdf'),
            subido_por=self.user_de,
            expediente=self.expediente,
        )

    def crear_usuario(self, username, nombre_rol, requiere_cambio_password=False):
        user = User.objects.create_user(username, password='ClaveSegura123!', email=f'{username}@ipvu.test')
        rol, _ = Rol.objects.get_or_create(nombre_rol=nombre_rol, defaults={'descripcion': nombre_rol})
        Usuario.objects.create(
            usuario=user, nombre='Test', apellido=username, dni='1', rol=rol,
            requiere_cambio_password=requiere_cambio_password,
        )
        return user

    def url_descarga(self, documento=None):
        return f'/api/documentoadjunto/{(documento or self.documento).id}/descargar/'


class DescargaDocumentosTests(SeguridadBaseTestCase):

    def test_sin_login_no_se_puede_descargar(self):
        response = self.client.get(self.url_descarga())
        self.assertEqual(response.status_code, 401)

    def test_usuario_sin_rol_no_puede_descargar(self):
        self.client.force_authenticate(self.user_sin_perfil)
        self.assertEqual(self.client.get(self.url_descarga()).status_code, 403)

    def test_usuario_con_rol_descarga_el_archivo_y_queda_auditado(self):
        self.client.force_authenticate(self.user_de)
        response = self.client.get(self.url_descarga())

        self.assertEqual(response.status_code, 200)
        self.assertEqual(b''.join(response.streaming_content), b'%PDF-1.4 dni de prueba')
        self.assertEqual(response['Content-Type'], 'application/pdf')
        self.assertTrue(HistorialAccion.objects.filter(
            id_expediente=self.expediente, mensaje_accion__startswith='DOWNLOAD',
        ).exists())

    def test_archivo_borrado_del_disco_responde_404(self):
        self.documento.archivo.storage.delete(self.documento.archivo.name)
        self.client.force_authenticate(self.user_de)
        self.assertEqual(self.client.get(self.url_descarga()).status_code, 404)

    def test_la_carpeta_media_no_es_publica(self):
        response = self.client.get(f'/media/{self.documento.archivo.name}')
        self.assertEqual(response.status_code, 404)

    def test_la_api_no_expone_la_url_de_media(self):
        self.client.force_authenticate(self.user_de)
        urls = [
            self.client.get(f'/api/documentoadjunto/?expediente={self.expediente.id}').data[0]['archivo_url'],
            self.client.get(f'/api/expediente/{self.expediente.id}/').data['documentos_adjuntos'][0]['archivo_url'],
        ]
        for url in urls:
            with self.subTest(url=url):
                self.assertEqual(url, self.url_descarga())

        archivo = self.client.get(f'/api/documentoadjunto/{self.documento.id}/').data['archivo']
        self.assertNotIn('/media/', archivo)


class SubidaDocumentosTests(SeguridadBaseTestCase):

    def subir(self, nombre, contenido=b'%PDF-1.4 contenido'):
        self.client.force_authenticate(self.user_de)
        return self.client.post('/api/documentoadjunto/', {
            'expediente': self.expediente.id,
            'tipo_documento': nombre,
            'archivo': SimpleUploadedFile(nombre, contenido),
        }, format='multipart')

    def test_acepta_pdf_e_imagenes(self):
        for nombre in ['ddjj.pdf', 'foto.JPG', 'foto.jpeg', 'scan.png']:
            with self.subTest(nombre=nombre):
                self.assertEqual(self.subir(nombre).status_code, 201)

    def test_rechaza_otros_formatos(self):
        for nombre in ['virus.exe', 'pagina.html', 'script.js', 'planilla.xlsx']:
            with self.subTest(nombre=nombre):
                self.assertEqual(self.subir(nombre).status_code, 400)

    @patch('gestion.serializers.TAMANIO_MAXIMO_ADJUNTO_MB', 0)
    def test_rechaza_archivos_demasiado_grandes(self):
        self.assertEqual(self.subir('ddjj.pdf').status_code, 400)

    def test_sin_login_no_se_puede_subir(self):
        response = self.client.post('/api/documentoadjunto/', {'tipo_documento': 'x'}, format='multipart')
        self.assertEqual(response.status_code, 401)


class PermisosPorDefectoTests(SeguridadBaseTestCase):

    def test_endpoints_privados_piden_login(self):
        for url in ['/api/expediente/', '/api/postulantetitular/', '/api/usuario/', '/api/documentoadjunto/',
                    '/api/historialaccion/', '/api/historialpase/', '/api/notificacion/', '/api/formulario/',
                    '/api/rol/', '/api/estadoexpediente/']:
            with self.subTest(url=url):
                self.assertEqual(self.client.get(url).status_code, 401)

    def test_endpoints_publicos_siguen_abiertos(self):
        response = self.client.post('/api/password-reset/solicitar/', {'email': 'nadie@ejemplo.com'})
        self.assertEqual(response.status_code, 200)

        response = self.client.post('/api/login/', {'username': 'dataentry', 'password': 'ClaveSegura123!'})
        self.assertEqual(response.status_code, 200)

    def test_con_login_y_rol_se_accede(self):
        self.client.force_authenticate(self.user_de)
        self.assertEqual(self.client.get('/api/expediente/').status_code, 200)


class TokensTests(SeguridadBaseTestCase):

    def login(self):
        response = self.client.post('/api/login/', {'username': 'dataentry', 'password': 'ClaveSegura123!'})
        self.assertEqual(response.status_code, 200)
        return response.data

    def test_login_entrega_access_y_refresh(self):
        data = self.login()
        self.assertIn('access', data)
        self.assertIn('refresh', data)
        self.assertEqual(data['rol_id'], self.user_de.usuario.rol.id)

    def test_el_access_dura_5_minutos(self):
        token = AccessToken(self.login()['access'])
        self.assertEqual(token['exp'] - token['iat'], 5 * 60)

    def test_refresh_entrega_tokens_nuevos(self):
        data = self.login()
        response = self.client.post('/api/token/refresh/', {'refresh': data['refresh']})

        self.assertEqual(response.status_code, 200)
        self.assertIn('access', response.data)
        # rotacion: cada renovacion devuelve un refresh nuevo, asi la sesion vence por inactividad
        self.assertIn('refresh', response.data)
        self.assertNotEqual(response.data['refresh'], data['refresh'])

    def test_el_token_sirve_para_llamar_a_la_api(self):
        access = self.login()['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access}')
        self.assertEqual(self.client.get('/api/expediente/').status_code, 200)

    def test_token_invalido_responde_401(self):
        self.client.credentials(HTTP_AUTHORIZATION='Bearer token-falso')
        self.assertEqual(self.client.get('/api/expediente/').status_code, 401)

    def test_password_incorrecta_responde_401(self):
        response = self.client.post('/api/login/', {'username': 'dataentry', 'password': 'mal'})
        self.assertEqual(response.status_code, 401)


class NotificacionExpedienteCreadoTests(SeguridadBaseTestCase):

    def setUp(self):
        super().setUp()
        self.ts = self.crear_usuario('ts1', 'TS')
        self.ts.usuario.nombre, self.ts.usuario.apellido = 'María', 'Pérez'
        self.ts.usuario.save()

    def crear_expediente(self):
        self.client.force_authenticate(self.user_de)
        return self.client.post('/api/postulantetitular/', {
            'nombre': 'Juan', 'apellido': 'Gómez', 'telefono': '385', 'dni': '45000000',
            'domicilio_actual': 'Calle 2', 'ddjj': 'DDJJ-123',
        })

    def notificaciones(self, user):
        self.client.force_authenticate(user)
        return [notif['mensaje'] for notif in self.client.get('/api/notificacion/').data]

    def test_la_respuesta_dice_a_quien_quedo_asignado(self):
        response = self.crear_expediente()
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data['asignado_a'], 'María Pérez')

    def test_la_data_entry_recibe_la_notificacion(self):
        self.crear_expediente()
        self.assertEqual(self.notificaciones(self.user_de), [
            'Expediente creado: Juan Gómez (DDJJ DDJJ-123), asignado a María Pérez',
        ])

    def test_la_trabajadora_social_sigue_recibiendo_la_suya(self):
        self.crear_expediente()
        self.assertEqual(self.notificaciones(self.ts), ['Nuevo caso recibido'])

    def test_la_notificacion_deja_de_verse_a_los_5_dias(self):
        self.crear_expediente()
        Notificacion.objects.update(fecha_creacion=timezone.now() - timedelta(days=4))
        self.assertEqual(len(self.notificaciones(self.user_de)), 1)

        Notificacion.objects.update(fecha_creacion=timezone.now() - timedelta(days=6))
        self.assertEqual(self.notificaciones(self.user_de), [])
        # no se borra de la base, y las de la TS no vencen
        self.assertEqual(Notificacion.objects.filter(usuario_destino=self.user_de).count(), 1)
        self.assertEqual(self.notificaciones(self.ts), ['Nuevo caso recibido'])
