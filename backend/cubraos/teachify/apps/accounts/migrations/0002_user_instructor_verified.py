# Generated migration for instructor_verified field

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="user",
            name="instructor_verified",
            field=models.BooleanField(default=False),
        ),
    ]
