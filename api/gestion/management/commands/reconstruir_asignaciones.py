"""
Agrega a los expedientes viejos el primer movimiento del historial: la asignacion automatica a una TS
al cargarlos. Desde que se agrego esto, la carga crea ese pase sola; los expedientes anteriores no lo tienen.

Se reconstruye con datos que ya estan en la base, sin inventar nada:
  - quien lo cargo: el registro de auditoria "Expediente ... creado y asignado a TS"
  - a que TS le toco: la notificacion "caso recibido" que recibio esa TS al momento de la carga
Los expedientes donde falta alguno de los dos datos se saltean y se listan.

Uso:
  python manage.py reconstruir_asignaciones            -> solo muestra lo que haria (no escribe)
  python manage.py reconstruir_asignaciones --aplicar  -> crea los pases

Se puede correr varias veces: no duplica los que ya tienen el pase de asignacion.
"""
from datetime import timedelta

from django.core.management.base import BaseCommand
from django.db import transaction

from gestion.models import (
    OBSERVACION_ASIGNACION_INICIAL, Expediente, HistorialAccion, HistorialPase, Notificacion,
)

# la notificacion a la TS se crea en el mismo request que el expediente: segundos despues
VENTANA_NOTIFICACION = timedelta(minutes=2)


class Command(BaseCommand):
    help = 'Reconstruye el pase de asignacion inicial de los expedientes cargados antes de que existiera.'

    def add_arguments(self, parser):
        parser.add_argument('--aplicar', action='store_true', help='Crea los pases (sin esto solo muestra).')

    def handle(self, *args, **opciones):
        aplicar = opciones['aplicar']
        ya_tienen = set(
            HistorialPase.objects.filter(observacion=OBSERVACION_ASIGNACION_INICIAL).values_list('expediente_id', flat=True)
        )
        a_crear, salteados = [], []

        for expediente in Expediente.objects.exclude(id__in=ya_tienen).order_by('id'):
            alta = (
                HistorialAccion.objects
                .filter(id_expediente=expediente, mensaje_accion__contains='creado y asignado')
                .select_related('id_usuario_accion__usuario')
                .order_by('fecha_accion')
                .first()
            )
            notificacion = (
                Notificacion.objects
                .filter(
                    expediente_relacionado=expediente,
                    usuario_destino__usuario__rol__nombre_rol='TS',
                    fecha_creacion__lte=expediente.fecha_creacion + VENTANA_NOTIFICACION,
                )
                .select_related('usuario_destino')
                .order_by('fecha_creacion')
                .first()
            )
            if not alta or not notificacion:
                falta = 'auditoria de la carga' if not alta else 'notificacion a la TS'
                salteados.append((expediente.id, falta))
                continue
            a_crear.append((expediente, alta.id_usuario_accion.usuario, notificacion.usuario_destino))

        for expediente, origen, destino in a_crear:
            self.stdout.write(f'Expediente {expediente.id}: {origen.username} -> {destino.username}')
        self.stdout.write(f'\nA crear: {len(a_crear)} | ya lo tenian: {len(ya_tienen)} | salteados: {len(salteados)}')
        if salteados:
            self.stdout.write('Salteados (falta el dato): ' + ', '.join(f'{i} ({f})' for i, f in salteados))

        if not aplicar:
            self.stdout.write(self.style.WARNING('\nModo prueba: no se escribio nada. Correr con --aplicar.'))
            return

        with transaction.atomic():
            for expediente, origen, destino in a_crear:
                pase = HistorialPase.objects.create(
                    expediente=expediente, usuario_origen=origen, usuario_destino=destino,
                    observacion=OBSERVACION_ASIGNACION_INICIAL,
                )
                # fecha_envio es auto_now_add: se corrige despues a la fecha real de la carga
                HistorialPase.objects.filter(id=pase.id).update(fecha_envio=expediente.fecha_creacion)
        self.stdout.write(self.style.SUCCESS(f'Listo: {len(a_crear)} pases de asignacion creados.'))
