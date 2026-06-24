# Generated manually to allow partial socio-habitational forms.

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('gestion', '0007_merge_migration_branches'),
    ]

    operations = [
        # Permite crear o guardar el formulario sin datos economicos cargados todavia.
        migrations.AlterField(
            model_name='formulariosociohabitacional',
            name='aspecto_economico',
            field=models.TextField(blank=True),
        ),
        # Permite que la informacion del grupo familiar quede pendiente.
        migrations.AlterField(
            model_name='formulariosociohabitacional',
            name='grupo_familiar',
            field=models.TextField(blank=True),
        ),
        # Permite que el nivel de estudios quede pendiente durante la carga parcial.
        migrations.AlterField(
            model_name='formulariosociohabitacional',
            name='nivel_estudios',
            field=models.CharField(blank=True, max_length=100),
        ),
        # Permite que observaciones quede vacio sin impedir guardar el formulario.
        migrations.AlterField(
            model_name='formulariosociohabitacional',
            name='observaciones',
            field=models.TextField(blank=True),
        ),
        # Permite que el relevamiento vecinal se complete mas adelante.
        migrations.AlterField(
            model_name='formulariosociohabitacional',
            name='relevamiento_vecinal',
            field=models.TextField(blank=True),
        ),
        # Permite que la situacion habitacional quede pendiente durante el avance del formulario.
        migrations.AlterField(
            model_name='formulariosociohabitacional',
            name='situacion_habitacional',
            field=models.TextField(blank=True),
        ),
        # Permite que la situacion de salud quede pendiente durante el avance del formulario.
        migrations.AlterField(
            model_name='formulariosociohabitacional',
            name='situacion_salud',
            field=models.TextField(blank=True),
        ),
    ]
