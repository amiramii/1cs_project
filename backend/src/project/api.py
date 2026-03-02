from ninja import NinjaAPI, Schema

api = NinjaAPI()

class UserSchema(Schema):
    username: str
    is_authenticated: bool

    class Config:
        from_attributes = True

@api.get("/me", response=UserSchema)
def me(request):
    return request.user