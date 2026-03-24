from rest_framework.permissions import IsAdminUser
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response 
from django.db import transaction 
import pandas as pd
import secrets
import string
import random
from .models import User
from rest_framework import permissions, viewsets
from .serializers import UserSerializer
from rest_framework.parsers import MultiPartParser
from django.core.mail import send_mail
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from rest_framework.permissions import AllowAny
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.contrib.auth.password_validation import validate_password

# Create your views here.




def generate_strong_password(length=8):
   
    lower = string.ascii_lowercase
    upper = string.ascii_uppercase
    digits = string.digits
    special = r"()[\]{}|\\`~!@#$%^&*_-+=;:'\",<>./?"

    password_chars = [
        secrets.choice(lower),
        secrets.choice(upper),
        secrets.choice(digits),
        secrets.choice(special),
    ]

    all_chars = lower + upper + digits + special
    password_chars += [secrets.choice(all_chars) for _ in range(length - 4)]

    random.shuffle(password_chars)

    return ''.join(password_chars)

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
           # username = row.get('full_name')
            id = row.get('n_inscript')
            email = row.get('email')
            temp_password = generate_strong_password()  
            if not email:
                errors.append({"row": index + 2, "error": "Missing username or email"})
                continue

            if User.objects.filter(email=email).exists():
                errors.append({"row": index + 2, "error": "Email already exists"})
                continue

            try:
                with transaction.atomic():
                    User.objects.create_user(
                        id=id,
                        #username=username,
                        email=email,
                        password=temp_password
                    )
                    users_created += 1
                    send_mail("Regarding authentication on the CheckIn platform",f"You can now log in using the following credentials:\nEmail:{email}\nTemporary Password: {temp_password}","nourimaram53@gmail.com", [email], )
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

class ResetPasswordRequest(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get("email")
        if not email:
            return Response({"error": "Email is required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({"msg": "If this email exists, a reset link has been sent."}, status=status.HTTP_200_OK)

        token_generator = PasswordResetTokenGenerator()
        token = token_generator.make_token(user)
        uidb64 = urlsafe_base64_encode(force_bytes(user.id))

        reset_link = f"http://localhost:3000/reset-password/{uidb64}/{token}/"

        try:
            send_mail(
                "Reset Your Password — CheckIn Platform",
                f"We received a request to reset your password for your CheckIn account.\n\n"
                f"Click the link below to reset your password:\n{reset_link}\n\n"
                f"This link is valid for a limited time and can only be used once.\n"
                f"If you did not request a password reset, you can ignore this email.",
                "nourimaram53@gmail.com",  
                [email],
            )
        except Exception as e:
            return Response({"error": f"Failed to send email: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response({"msg": "If this email exists, a reset link has been sent."}, status=status.HTTP_200_OK)


class ResetPassword(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        uidb64 = request.data.get("uidb64")
        token = request.data.get("token")
        new_password = request.data.get("new_password")

        if not uidb64 or not token or not new_password:
            return Response({"error": "uidb64, token, and new_password are required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            uid = force_str(urlsafe_base64_decode(uidb64))
            user = User.objects.get(id=uid)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            return Response({"error": "Invalid link"}, status=status.HTTP_400_BAD_REQUEST)

        token_generator = PasswordResetTokenGenerator()
        if not token_generator.check_token(user, token):
            return Response({"error": "Invalid or expired token"}, status=status.HTTP_400_BAD_REQUEST)
        validate_password(new_password, user)
        user.set_password(new_password)
        user.save()

        return Response({"msg": "Password has been reset successfully"}, status=status.HTTP_200_OK)

