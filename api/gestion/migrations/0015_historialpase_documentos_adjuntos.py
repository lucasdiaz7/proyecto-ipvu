from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('gestion', '0014_usuario_activo'),
    ]

    operations = [
        migrations.AddField(
            model_name='historialpase',
            name='documentos_adjuntos',
            field=models.ManyToManyField(
                blank=True,
                related_name='historial_pases',
                to='gestion.documentoadjunto',
            ),
        ),
    ]
