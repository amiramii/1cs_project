from rest_framework import serializers
from .models import User
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.settings import api_settings

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "email", "password"]

class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def validate(self, attrs):
        data = super().validate(attrs)
        
        data['access_expires_in'] = int(api_settings.ACCESS_TOKEN_LIFETIME.total_seconds())
        data['refresh_expires_in'] = int(api_settings.REFRESH_TOKEN_LIFETIME.total_seconds())
        