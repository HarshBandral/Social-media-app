from datetime import datetime, timezone
from itertools import groupby
from operator import attrgetter

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models.friendship import FriendRequest
from models.story import Story
from models.user import User
from schemas.story import StoryGroupResponse, StoryResponse
from utils.auth import get_current_user
from utils.file_upload import save_upload

router = APIRouter(prefix="/stories", tags=["Stories"])


def _story_response(story: Story, author: User) -> StoryResponse:
    return StoryResponse(
        id=story.id,
        user_id=story.user_id,
        image_url=story.image_url,
        created_at=story.created_at,
        expires_at=story.expires_at,
        author_username=author.username,
        author_avatar=author.avatar_url,
    )


@router.post("", response_model=StoryResponse, status_code=201)
async def create_story(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    image_url = await save_upload(file, subfolder="stories")
    story = Story(user_id=current_user.id, image_url=image_url)
    db.add(story)
    await db.commit()
    await db.refresh(story)
    return _story_response(story, current_user)


@router.get("", response_model=list[StoryGroupResponse])
async def get_stories_feed(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    now = datetime.now(timezone.utc)

    # Get friend IDs
    friend_reqs = await db.execute(
        select(FriendRequest).where(
            FriendRequest.status == "accepted",
            (FriendRequest.from_user_id == current_user.id)
            | (FriendRequest.to_user_id == current_user.id),
        )
    )
    friend_ids = set()
    for fr in friend_reqs.scalars().all():
        if fr.from_user_id == current_user.id:
            friend_ids.add(fr.to_user_id)
        else:
            friend_ids.add(fr.from_user_id)
    friend_ids.add(current_user.id)

    # Get active stories from friends + public users
    result = await db.execute(
        select(Story)
        .join(User, Story.user_id == User.id)
        .where(
            Story.expires_at > now,
            (User.is_private == False) | (Story.user_id.in_(friend_ids)),  # noqa: E712
        )
        .order_by(Story.user_id, desc(Story.created_at))
    )
    stories = result.scalars().all()

    # Group by user
    groups = []
    for user_id, user_stories in groupby(stories, key=attrgetter("user_id")):
        story_list = list(user_stories)
        author = await db.get(User, user_id)
        if author:
            groups.append(
                StoryGroupResponse(
                    user_id=user_id,
                    username=author.username,
                    avatar_url=author.avatar_url,
                    stories=[_story_response(s, author) for s in story_list],
                )
            )

    # Put current user's stories first
    groups.sort(key=lambda g: g.user_id != current_user.id)
    return groups


@router.get("/me", response_model=list[StoryResponse])
async def get_my_stories(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    now = datetime.now(timezone.utc)
    result = await db.execute(
        select(Story)
        .where(Story.user_id == current_user.id, Story.expires_at > now)
        .order_by(desc(Story.created_at))
    )
    stories = result.scalars().all()
    return [_story_response(s, current_user) for s in stories]


@router.delete("/{story_id}", status_code=204)
async def delete_story(
    story_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    story = await db.get(Story, story_id)
    if not story:
        raise HTTPException(status_code=404, detail="Story not found")
    if story.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your story")
    await db.delete(story)
    await db.commit()
