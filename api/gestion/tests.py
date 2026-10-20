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
        usuario=SimpleNamespace(rol=SimpleNamespace(nombre_rol=nombre_rol)),
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
