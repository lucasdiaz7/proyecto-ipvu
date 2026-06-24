# Generated manually to keep model options synchronized with migrations.

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('gestion', '0008_formulario_campos_opcionales'),
    ]

    operations = [
        # Registra el ordenamiento definido en el modelo HistorialPase.
        migrations.AlterModelOptions(
            name='historialpase',
            options={'ordering': ['-id']},
        ),
    ]
