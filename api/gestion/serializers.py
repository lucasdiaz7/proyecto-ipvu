from rest_framework import serializers
from .models import *

class PostulanteTitularSerializer(serializers.ModelSerializer):
    class Meta:
        model = PostulanteTitular
        