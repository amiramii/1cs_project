from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User
# Register your models here.

class CustomUserAdmin(UserAdmin):
    model = User
    list_display = ['email','username', 'is_staff']
    search_fields = ['email']
    ordering = ("email",)

admin.site.register(User, CustomUserAdmin)
