from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class DocumentType(models.Model):
    AUDIENCE_CHOICES = [
        ('student', 'Student'),
        ('teacher', 'Teacher'),
    ]

    name = models.CharField(max_length=100)
    audience = models.CharField(max_length=10, choices=AUDIENCE_CHOICES)

    def __str__(self):
        return f"{self.name} ({self.audience})"


class Document(models.Model):
    title = models.CharField(max_length=200)
    pdf = models.FileField(upload_to='documents/')
    document_type = models.ForeignKey(DocumentType, on_delete=models.CASCADE)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title