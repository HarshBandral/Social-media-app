from datetime import datetime

from pydantic import BaseModel


class MessageCreate(BaseModel):
    content: str


class MessageResponse(BaseModel):
    id: str
    conversation_id: str
    sender_id: str
    content: str
    is_read: bool
    created_at: datetime
    sender_username: str
    sender_avatar: str | None = None

    model_config = {"from_attributes": True}


class ConversationResponse(BaseModel):
    id: str
    other_user_id: str
    other_username: str
    other_avatar: str | None = None
    last_message: str | None = None
    last_message_time: datetime | None = None
    unread_count: int = 0

    model_config = {"from_attributes": True}


class StartConversation(BaseModel):
    user_id: str
    message: str
