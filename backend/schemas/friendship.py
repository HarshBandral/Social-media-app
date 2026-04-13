from datetime import datetime

from pydantic import BaseModel


class FriendRequestCreate(BaseModel):
    to_user_id: str


class FriendRequestResponse(BaseModel):
    id: str
    from_user_id: str
    to_user_id: str
    status: str
    created_at: datetime
    from_username: str
    from_avatar: str | None = None
    to_username: str
    to_avatar: str | None = None

    model_config = {"from_attributes": True}


class FriendResponse(BaseModel):
    id: str
    username: str
    full_name: str
    avatar_url: str | None = None

    model_config = {"from_attributes": True}
