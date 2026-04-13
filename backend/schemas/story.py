from datetime import datetime

from pydantic import BaseModel


class StoryResponse(BaseModel):
    id: str
    user_id: str
    image_url: str
    created_at: datetime
    expires_at: datetime
    author_username: str
    author_avatar: str | None = None

    model_config = {"from_attributes": True}


class StoryGroupResponse(BaseModel):
    user_id: str
    username: str
    avatar_url: str | None = None
    stories: list[StoryResponse]
