from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models.user import User
from models.friendship import FriendRequest
from models.post import Post
from schemas.user import (
    ChangePassword,
    ForgotPassword,
    ResetPassword,
    TokenResponse,
    UserCreate,
    UserLogin,
    UserResponse,
)
from utils.auth import (
    create_access_token,
    create_reset_token,
    get_current_user,
    hash_password,
    verify_password,
    verify_reset_token,
)

router = APIRouter(prefix="/auth", tags=["Authentication"])


async def _build_user_response(db: AsyncSession, user: User) -> UserResponse:
    post_count = await db.scalar(
        select(func.count()).select_from(Post).where(Post.user_id == user.id)
    )
    friends_count = await db.scalar(
        select(func.count())
        .select_from(FriendRequest)
        .where(
            FriendRequest.status == "accepted",
            (FriendRequest.from_user_id == user.id)
            | (FriendRequest.to_user_id == user.id),
        )
    )
    return UserResponse(
        id=user.id,
        email=user.email,
        username=user.username,
        full_name=user.full_name,
        bio=user.bio,
        avatar_url=user.avatar_url,
        is_private=user.is_private,
        created_at=user.created_at,
        post_count=post_count or 0,
        friends_count=friends_count or 0,
    )


@router.post("/register", response_model=TokenResponse, status_code=201)
async def register(data: UserCreate, db: AsyncSession = Depends(get_db)):
    existing = await db.execute(
        select(User).where((User.email == data.email) | (User.username == data.username))
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email or username already exists")

    user = User(
        email=data.email,
        username=data.username,
        full_name=data.full_name,
        password_hash=hash_password(data.password),
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    token = create_access_token({"sub": user.id})
    user_resp = await _build_user_response(db, user)
    return TokenResponse(access_token=token, user=user_resp)


@router.post("/login", response_model=TokenResponse)
async def login(data: UserLogin, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == data.email))
    user = result.scalar_one_or_none()

    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token({"sub": user.id})
    user_resp = await _build_user_response(db, user)
    return TokenResponse(access_token=token, user=user_resp)


@router.post("/forgot-password")
async def forgot_password(data: ForgotPassword, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == data.email))
    user = result.scalar_one_or_none()
    if user:
        reset_token = create_reset_token(user.email)
        # In production, send this via email
        return {"message": "Reset link sent", "reset_token": reset_token}
    return {"message": "If that email exists, a reset link has been sent"}


@router.post("/reset-password")
async def reset_password(data: ResetPassword, db: AsyncSession = Depends(get_db)):
    email = verify_reset_token(data.token)
    if not email:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")

    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.password_hash = hash_password(data.new_password)
    await db.commit()
    return {"message": "Password reset successfully"}


@router.post("/change-password")
async def change_password(
    data: ChangePassword,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not verify_password(data.current_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Current password is incorrect")

    current_user.password_hash = hash_password(data.new_password)
    await db.commit()
    return {"message": "Password changed successfully"}
