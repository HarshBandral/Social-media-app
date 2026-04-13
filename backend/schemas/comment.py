from datetime import datetime

from pydantic import BaseModel


class CommentCreate(BaseModel):
    content: str


class CommentResponse(BaseModel):
    id: str
    user_id: str
    post_id: str
    parent_id: str | None = None
    content: str
    created_at: datetime
    author_username: str
    author_avatar: str | None = None
    replies_count: int = 0

    model_config = {"from_attributes": True}
