from datetime import datetime

from pydantic import BaseModel, EmailStr


class UserCreate(BaseModel):
    email: EmailStr
    username: str
    full_name: str
    password: str


class UserLogin(BaseModel):
    email: str
    password: str


class UserResponse(BaseModel):
    id: str
    email: str
    username: str
    full_name: str
    bio: str | None = None
    avatar_url: str | None = None
    is_private: bool = False
    created_at: datetime
    post_count: int = 0
    friends_count: int = 0

    model_config = {"from_attributes": True}


class UserUpdate(BaseModel):
    full_name: str | None = None
    bio: str | None = None
    username: str | None = None


class ChangePassword(BaseModel):
    current_password: str
    new_password: str


class ForgotPassword(BaseModel):
    email: EmailStr


class ResetPassword(BaseModel):
    token: str
    new_password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class PrivacyUpdate(BaseModel):
    is_private: bool
