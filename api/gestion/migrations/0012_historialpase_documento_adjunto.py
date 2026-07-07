# Generated manually for linking a pass history entry with one optional document.

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('gestion', '0011_delete_dictamenlegal'),
    ]

    operations = [
        migrations.AddField(
            model_name='historialpase',
            name='documento_adjunto',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='historial_pases',
                to='gestion.documentoadjunto',
            ),
        ),
    ]
