from django.db import models
from django.contrib.auth.models import AbstractUser, BaseUserManager
# Create your models here.



class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("Email must be set")

        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)

        return self.create_user(email, password, **extra_fields)

class User(AbstractUser):
    class Roles(models.TextChoices):
        ADMIN = "ADMIN", "Admin"
        STUDENT = "STUDENT", "Student"
        TEACHER = "TEACHER", "Teacher"
        SCHOOLING = "SCHOOLING", "Schooling"
    
    role = models.CharField(
        max_length=20, choices=Roles.choices, default=Roles.ADMIN
    )
    username = None
    email = models.EmailField(unique=True)
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []
    objects = UserManager()
    
class Student(models.Model):
     user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="student_profile")
     level = models.CharField(max_length=50)
     group = models.CharField(max_length=50)

     def __str__(self):
        return self.user.email
     
class Teacher(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="teacher_profile")

    def __str__(self):
        return self.user.email
class Schooling(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="schooling_profile")

    def __str__(self):
        return self.user.email