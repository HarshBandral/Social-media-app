from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func, desc
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models.comment import Comment
from models.post import Post
from models.user import User
from schemas.comment import CommentCreate, CommentResponse
from utils.auth import get_current_user

router = APIRouter(prefix="/posts", tags=["Comments"])


async def _build_comment_response(db: AsyncSession, comment: Comment) -> CommentResponse:
    author = await db.get(User, comment.user_id)
    replies_count = await db.scalar(
        select(func.count()).select_from(Comment).where(Comment.parent_id == comment.id)
    )
    return CommentResponse(
        id=comment.id,
        user_id=comment.user_id,
        post_id=comment.post_id,
        parent_id=comment.parent_id,
        content=comment.content,
        created_at=comment.created_at,
        author_username=author.username if author else "deleted",
        author_avatar=author.avatar_url if author else None,
        replies_count=replies_count or 0,
    )


@router.post("/{post_id}/comments", response_model=CommentResponse, status_code=201)
async def create_comment(
    post_id: str,
    data: CommentCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    post = await db.get(Post, post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    comment = Comment(
        user_id=current_user.id, post_id=post_id, content=data.content
    )
    db.add(comment)
    await db.commit()
    await db.refresh(comment)
    return await _build_comment_response(db, comment)


@router.get("/{post_id}/comments", response_model=list[CommentResponse])
async def get_comments(
    post_id: str,
    page: int = 1,
    limit: int = 20,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Comment)
        .where(Comment.post_id == post_id, Comment.parent_id.is_(None))
        .order_by(desc(Comment.created_at))
        .offset((page - 1) * limit)
        .limit(limit)
    )
    comments = result.scalars().all()
    return [await _build_comment_response(db, c) for c in comments]


@router.post(
    "/{post_id}/comments/{comment_id}/replies",
    response_model=CommentResponse,
    status_code=201,
)
async def reply_to_comment(
    post_id: str,
    comment_id: str,
    data: CommentCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    parent = await db.get(Comment, comment_id)
    if not parent or parent.post_id != post_id:
        raise HTTPException(status_code=404, detail="Comment not found")

    reply = Comment(
        user_id=current_user.id,
        post_id=post_id,
        parent_id=comment_id,
        content=data.content,
    )
    db.add(reply)
    await db.commit()
    await db.refresh(reply)
    return await _build_comment_response(db, reply)


@router.get(
    "/{post_id}/comments/{comment_id}/replies",
    response_model=list[CommentResponse],
)
async def get_replies(
    post_id: str,
    comment_id: str,
    page: int = 1,
    limit: int = 20,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Comment)
        .where(Comment.parent_id == comment_id, Comment.post_id == post_id)
        .order_by(Comment.created_at)
        .offset((page - 1) * limit)
        .limit(limit)
    )
    replies = result.scalars().all()
    return [await _build_comment_response(db, r) for r in replies]


@router.delete("/{post_id}/comments/{comment_id}", status_code=204)
async def delete_comment(
    post_id: str,
    comment_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    comment = await db.get(Comment, comment_id)
    if not comment or comment.post_id != post_id:
        raise HTTPException(status_code=404, detail="Comment not found")
    if comment.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your comment")
    await db.delete(comment)
    await db.commit()
