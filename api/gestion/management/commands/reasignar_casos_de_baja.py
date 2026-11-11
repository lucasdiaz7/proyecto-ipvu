"""
Reparte los expedientes que quedaron trabados a nombre de usuarios que ya estaban dados de baja antes de
que la baja los repartiera sola (ver reasignar_casos_por_baja en views.py).

Uso:
  python manage.py reasignar_casos_de_baja            -> solo muestra lo que haria (no escribe)
  python manage.py reasignar_casos_de_baja --aplicar  -> reparte los casos
"""
from django.core.management.base import BaseCommand

from gestion.models import Expediente, Usuario
from gestion.views import reasignar_casos_por_baja


class Command(BaseCommand):
    help = 'Reparte entre los usuarios activos los expedientes que siguen a nombre de usuarios dados de baja.'

    def add_arguments(self, parser):
        parser.add_argument('--aplicar', action='store_true', help='Reparte los casos (sin esto solo muestra).')

    def handle(self, *args, **opciones):
        total = 0
        for perfil in Usuario.objects.filter(activo=False).select_related('usuario', 'rol').order_by('id'):
            cantidad = Expediente.objects.filter(usuario_asignado=perfil.usuario).count()
            if not cantidad:
                continue
            self.stdout.write(f'{perfil.nombre} {perfil.apellido} ({perfil.rol.nombre_rol}): {cantidad} expediente(s)')
            if opciones['aplicar']:
                total += reasignar_casos_por_baja(perfil)
        if opciones['aplicar']:
            self.stdout.write(self.style.SUCCESS(f'Listo: {total} expediente(s) reasignados.'))
        else:
            self.stdout.write(self.style.WARNING('Modo prueba: no se escribio nada. Correr con --aplicar.'))
