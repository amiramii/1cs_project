from rest_framework.permissions import IsAdminUser
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.parsers import FileUploadParser 
from rest_framework.response import Response 
from django.db import transaction 
import pandas as pd
import secrets
from django.contrib.auth.models import User
from rest_framework import permissions, viewsets
from .serializers import UserSerializer
from rest_framework.parsers import MultiPartParser
from django.core.mail import send_mail
# Create your views here.

class UploadCSVFile(APIView):
    parser_classes = [MultiPartParser]
    permission_classes = [IsAdminUser]

    def post(self, request):
        csv_file = request.FILES.get('file')
        if not csv_file:
            return Response({"error": "No file provided"}, status=status.HTTP_400_BAD_REQUEST)

        if not csv_file.name.endswith('.csv'):
            return Response({"error": "File is not CSV type"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            df = pd.read_csv(csv_file, delimiter=',', skiprows=0, dtype=str) 
            df = df.where(pd.notnull(df), None)
        except Exception as e:
            return Response({"error": f"Failed to read CSV: {e}"}, status=status.HTTP_400_BAD_REQUEST)

        users_created = 0
        errors = []

        for index, row in df.iterrows():
            username = row.get('full_name')
            id = row.get('n_inscript')
            email = row.get('email')
            temp_password = secrets.token_urlsafe(8)  
            if not username or not email:
                errors.append({"row": index + 2, "error": "Missing username or email"})
                continue

            if User.objects.filter(username=username).exists():
                errors.append({"row": index + 2, "error": "Username already exists"})
                continue

            try:
                with transaction.atomic():
                    User.objects.create_user(
                        id=id,
                        username=username,
                        email=email,
                        password=temp_password
                    )
                    users_created += 1
                    send_mail("Regarding authentication on the CheckIn platform",f"You can now log in using the following credentials:\nUsername:{email}\nTemporary Password: {temp_password}","nourimaram53@gmail.com", [email], )
            except Exception as e:
                errors.append({"row": index + 2, "error": str(e)})

        return Response(
            {
                "msg": "CSV processed",
                "users_created": users_created,
                "errors": errors
            },
            status=status.HTTP_201_CREATED
        )
    
class UserViewSet(viewsets.ModelViewSet):
        queryset = User.objects.all()
        serializer_class = UserSerializer
        permission_classes = [IsAdminUser]