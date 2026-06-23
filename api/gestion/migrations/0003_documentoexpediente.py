# Generated manually for safe-business-changes

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('gestion', '0002_alter_estadoexpediente_nombre'),
    ]

    operations = [
        migrations.CreateModel(
            name='DocumentoExpediente',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('archivo', models.FileField(upload_to='expedientes/')),
                ('fecha_subida', models.DateTimeField(auto_now_add=True)),
                ('expediente', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='documentos', to='gestion.expediente')),
            ],
        ),
    ]
