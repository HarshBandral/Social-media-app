from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models.user import User
from models.post import Post
from models.friendship import FriendRequest
from schemas.user import PrivacyUpdate, UserResponse, UserUpdate
from utils.auth import get_current_user
from utils.file_upload import save_upload

router = APIRouter(prefix="/users", tags=["Users"])


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


@router.get("/me", response_model=UserResponse)
async def get_me(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await _build_user_response(db, current_user)


@router.put("/me", response_model=UserResponse)
async def update_me(
    data: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if data.username:
        existing = await db.execute(
            select(User).where(User.username == data.username, User.id != current_user.id)
        )
        if existing.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Username already taken")
        current_user.username = data.username
    if data.full_name is not None:
        current_user.full_name = data.full_name
    if data.bio is not None:
        current_user.bio = data.bio
    await db.commit()
    await db.refresh(current_user)
    return await _build_user_response(db, current_user)


@router.patch("/me/privacy", response_model=UserResponse)
async def update_privacy(
    data: PrivacyUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    current_user.is_private = data.is_private
    await db.commit()
    await db.refresh(current_user)
    return await _build_user_response(db, current_user)


@router.post("/me/avatar", response_model=UserResponse)
async def upload_avatar(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    url = await save_upload(file, subfolder="avatars")
    current_user.avatar_url = url
    await db.commit()
    await db.refresh(current_user)
    return await _build_user_response(db, current_user)


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return await _build_user_response(db, user)


@router.get("/search/{query}")
async def search_users(
    query: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(User)
        .where(
            User.id != current_user.id,
            (User.username.ilike(f"%{query}%")) | (User.full_name.ilike(f"%{query}%")),
        )
        .limit(20)
    )
    users = result.scalars().all()
    return [await _build_user_response(db, u) for u in users]
