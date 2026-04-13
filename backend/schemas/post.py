from datetime import datetime

from pydantic import BaseModel


class PostCreate(BaseModel):
    caption: str | None = None


class PostResponse(BaseModel):
    id: str
    user_id: str
    caption: str | None = None
    image_url: str
    created_at: datetime
    author_username: str
    author_avatar: str | None = None
    likes_count: int = 0
    comments_count: int = 0
    is_liked: bool = False
    is_bookmarked: bool = False

    model_config = {"from_attributes": True}
