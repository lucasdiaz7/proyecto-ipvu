# Generated manually to support expediente receipt notifications.

from django.db import migrations, models
import django.db.models.deletion


# Limpia referencias viejas antes de convertir expediente_relacionado de User a Expediente.
# Los valores anteriores apuntaban a usuarios, por eso no se pueden conservar como expedientes.
def limpiar_expediente_relacionado(apps, schema_editor):
    Notificacion = apps.get_model('gestion', 'Notificacion')
    Notificacion.objects.update(expediente_relacionado=None)


class Migration(migrations.Migration):

    dependencies = [
        ('gestion', '0005_delete_integrantefamilia'),
    ]

    operations = [
        # Corrige el typo del campo usuario_destimo sin perder las notificaciones existentes.
        migrations.RenameField(
            model_name='notificacion',
            old_name='usuario_destimo',
            new_name='usuario_destino',
        ),
        # Deja en null el campo antes de cambiarlo para evitar conflictos de claves foraneas.
        migrations.RunPython(
            limpiar_expediente_relacionado,
            migrations.RunPython.noop
        ),
        # Relaciona cada notificacion con el expediente que la origino.
        migrations.AlterField(
            model_name='notificacion',
            name='expediente_relacionado',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                to='gestion.expediente'
            ),
        ),
    ]
