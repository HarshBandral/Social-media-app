from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy import select, func, desc
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models.comment import Comment
from models.like import Like
from models.post import Post
from models.user import User
from models.friendship import FriendRequest
from schemas.post import PostResponse
from utils.auth import get_current_user
from utils.file_upload import save_upload

router = APIRouter(prefix="/posts", tags=["Posts"])


async def _build_post_response(
    db: AsyncSession, post: Post, current_user_id: str
) -> PostResponse:
    author = await db.get(User, post.user_id)
    likes_count = await db.scalar(
        select(func.count()).select_from(Like).where(Like.post_id == post.id)
    )
    comments_count = await db.scalar(
        select(func.count()).select_from(Comment).where(
            Comment.post_id == post.id, Comment.parent_id.is_(None)
        )
    )
    is_liked = await db.scalar(
        select(func.count())
        .select_from(Like)
        .where(Like.post_id == post.id, Like.user_id == current_user_id)
    )
    return PostResponse(
        id=post.id,
        user_id=post.user_id,
        caption=post.caption,
        image_url=post.image_url,
        created_at=post.created_at,
        author_username=author.username if author else "deleted",
        author_avatar=author.avatar_url if author else None,
        likes_count=likes_count or 0,
        comments_count=comments_count or 0,
        is_liked=bool(is_liked),
    )


@router.post("", response_model=PostResponse, status_code=201)
async def create_post(
    file: UploadFile = File(...),
    caption: str | None = Form(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    image_url = await save_upload(file, subfolder="posts")
    post = Post(user_id=current_user.id, caption=caption, image_url=image_url)
    db.add(post)
    await db.commit()
    await db.refresh(post)
    return await _build_post_response(db, post, current_user.id)


@router.get("", response_model=list[PostResponse])
async def get_feed(
    page: int = 1,
    limit: int = 20,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Get friends' IDs
    friend_ids_q = await db.execute(
        select(FriendRequest).where(
            FriendRequest.status == "accepted",
            (FriendRequest.from_user_id == current_user.id)
            | (FriendRequest.to_user_id == current_user.id),
        )
    )
    friend_requests = friend_ids_q.scalars().all()
    friend_ids = set()
    for fr in friend_requests:
        if fr.from_user_id == current_user.id:
            friend_ids.add(fr.to_user_id)
        else:
            friend_ids.add(fr.from_user_id)
    friend_ids.add(current_user.id)

    # Get public users' posts + friends' posts
    result = await db.execute(
        select(Post)
        .join(User, Post.user_id == User.id)
        .where((User.is_private == False) | (Post.user_id.in_(friend_ids)))  # noqa: E712
        .order_by(desc(Post.created_at))
        .offset((page - 1) * limit)
        .limit(limit)
    )
    posts = result.scalars().all()
    return [await _build_post_response(db, p, current_user.id) for p in posts]


@router.get("/user/{user_id}", response_model=list[PostResponse])
async def get_user_posts(
    user_id: str,
    page: int = 1,
    limit: int = 20,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    target_user = await db.get(User, user_id)
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    # Check privacy
    if target_user.is_private and target_user.id != current_user.id:
        is_friend = await db.scalar(
            select(func.count())
            .select_from(FriendRequest)
            .where(
                FriendRequest.status == "accepted",
                (
                    (FriendRequest.from_user_id == current_user.id)
                    & (FriendRequest.to_user_id == user_id)
                )
                | (
                    (FriendRequest.from_user_id == user_id)
                    & (FriendRequest.to_user_id == current_user.id)
                ),
            )
        )
        if not is_friend:
            raise HTTPException(status_code=403, detail="This account is private")

    result = await db.execute(
        select(Post)
        .where(Post.user_id == user_id)
        .order_by(desc(Post.created_at))
        .offset((page - 1) * limit)
        .limit(limit)
    )
    posts = result.scalars().all()
    return [await _build_post_response(db, p, current_user.id) for p in posts]


@router.get("/{post_id}", response_model=PostResponse)
async def get_post(
    post_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    post = await db.get(Post, post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    return await _build_post_response(db, post, current_user.id)


@router.delete("/{post_id}", status_code=204)
async def delete_post(
    post_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    post = await db.get(Post, post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    if post.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your post")
    await db.delete(post)
    await db.commit()


@router.post("/{post_id}/like", status_code=201)
async def like_post(
    post_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    post = await db.get(Post, post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    existing = await db.execute(
        select(Like).where(Like.user_id == current_user.id, Like.post_id == post_id)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Already liked")

    like = Like(user_id=current_user.id, post_id=post_id)
    db.add(like)
    await db.commit()
    return {"message": "Post liked"}


@router.delete("/{post_id}/like", status_code=204)
async def unlike_post(
    post_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Like).where(Like.user_id == current_user.id, Like.post_id == post_id)
    )
    like = result.scalar_one_or_none()
    if not like:
        raise HTTPException(status_code=404, detail="Not liked")
    await db.delete(like)
    await db.commit()
