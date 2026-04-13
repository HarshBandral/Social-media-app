import json
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from jose import JWTError, jwt
from sqlalchemy import select, func, desc, or_, and_
from sqlalchemy.ext.asyncio import AsyncSession

from config import settings
from database import get_db, async_session
from models.conversation import Conversation, Message
from models.user import User
from schemas.conversation import (
    ConversationResponse,
    MessageCreate,
    MessageResponse,
    StartConversation,
)
from utils.auth import get_current_user

router = APIRouter(prefix="/chat", tags=["Chat"])


# ── WebSocket connection manager ──────────────────────────────────────────────
class ConnectionManager:
    def __init__(self):
        # user_id -> list of websockets (supports multiple devices)
        self.active: dict[str, list[WebSocket]] = {}

    async def connect(self, user_id: str, ws: WebSocket):
        await ws.accept()
        self.active.setdefault(user_id, []).append(ws)

    def disconnect(self, user_id: str, ws: WebSocket):
        if user_id in self.active:
            self.active[user_id] = [w for w in self.active[user_id] if w is not ws]
            if not self.active[user_id]:
                del self.active[user_id]

    async def send_to_user(self, user_id: str, data: dict):
        for ws in self.active.get(user_id, []):
            try:
                await ws.send_json(data)
            except Exception:
                pass


manager = ConnectionManager()


# ── Helper ────────────────────────────────────────────────────────────────────
async def _build_message_response(db: AsyncSession, msg: Message) -> MessageResponse:
    sender = await db.get(User, msg.sender_id)
    return MessageResponse(
        id=msg.id,
        conversation_id=msg.conversation_id,
        sender_id=msg.sender_id,
        content=msg.content,
        is_read=msg.is_read,
        created_at=msg.created_at,
        sender_username=sender.username if sender else "deleted",
        sender_avatar=sender.avatar_url if sender else None,
    )


async def _get_or_create_conversation(
    db: AsyncSession, user1_id: str, user2_id: str
) -> Conversation:
    result = await db.execute(
        select(Conversation).where(
            or_(
                and_(
                    Conversation.user1_id == user1_id,
                    Conversation.user2_id == user2_id,
                ),
                and_(
                    Conversation.user1_id == user2_id,
                    Conversation.user2_id == user1_id,
                ),
            )
        )
    )
    conv = result.scalar_one_or_none()
    if conv:
        return conv

    conv = Conversation(user1_id=user1_id, user2_id=user2_id)
    db.add(conv)
    await db.commit()
    await db.refresh(conv)
    return conv


# ── REST endpoints ────────────────────────────────────────────────────────────

@router.get("/conversations", response_model=list[ConversationResponse])
async def get_conversations(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Conversation)
        .where(
            or_(
                Conversation.user1_id == current_user.id,
                Conversation.user2_id == current_user.id,
            )
        )
        .order_by(desc(Conversation.updated_at))
    )
    conversations = result.scalars().all()

    responses = []
    for conv in conversations:
        other_id = (
            conv.user2_id if conv.user1_id == current_user.id else conv.user1_id
        )
        other_user = await db.get(User, other_id)
        if not other_user:
            continue

        # Last message
        last_msg_result = await db.execute(
            select(Message)
            .where(Message.conversation_id == conv.id)
            .order_by(desc(Message.created_at))
            .limit(1)
        )
        last_msg = last_msg_result.scalar_one_or_none()

        # Unread count
        unread = await db.scalar(
            select(func.count())
            .select_from(Message)
            .where(
                Message.conversation_id == conv.id,
                Message.sender_id != current_user.id,
                Message.is_read == False,  # noqa: E712
            )
        )

        responses.append(
            ConversationResponse(
                id=conv.id,
                other_user_id=other_id,
                other_username=other_user.username,
                other_avatar=other_user.avatar_url,
                last_message=last_msg.content if last_msg else None,
                last_message_time=last_msg.created_at if last_msg else conv.created_at,
                unread_count=unread or 0,
            )
        )

    return responses


@router.post("/conversations", response_model=ConversationResponse)
async def start_conversation(
    data: StartConversation,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if data.user_id == current_user.id:
        raise HTTPException(400, "Cannot message yourself")

    target = await db.get(User, data.user_id)
    if not target:
        raise HTTPException(404, "User not found")

    conv = await _get_or_create_conversation(db, current_user.id, data.user_id)

    # Send first message
    msg = Message(
        conversation_id=conv.id,
        sender_id=current_user.id,
        content=data.message,
    )
    db.add(msg)
    conv.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(msg)

    # Push via WebSocket
    msg_resp = await _build_message_response(db, msg)
    await manager.send_to_user(
        data.user_id,
        {"type": "new_message", "message": msg_resp.model_dump(mode="json")},
    )

    return ConversationResponse(
        id=conv.id,
        other_user_id=data.user_id,
        other_username=target.username,
        other_avatar=target.avatar_url,
        last_message=msg.content,
        last_message_time=msg.created_at,
        unread_count=0,
    )


@router.get("/conversations/{conversation_id}/messages", response_model=list[MessageResponse])
async def get_messages(
    conversation_id: str,
    page: int = 1,
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    conv = await db.get(Conversation, conversation_id)
    if not conv:
        raise HTTPException(404, "Conversation not found")
    if current_user.id not in (conv.user1_id, conv.user2_id):
        raise HTTPException(403, "Not your conversation")

    # Mark messages as read
    unread_result = await db.execute(
        select(Message).where(
            Message.conversation_id == conversation_id,
            Message.sender_id != current_user.id,
            Message.is_read == False,  # noqa: E712
        )
    )
    for msg in unread_result.scalars().all():
        msg.is_read = True
    await db.commit()

    result = await db.execute(
        select(Message)
        .where(Message.conversation_id == conversation_id)
        .order_by(desc(Message.created_at))
        .offset((page - 1) * limit)
        .limit(limit)
    )
    messages = result.scalars().all()
    return [await _build_message_response(db, m) for m in reversed(messages)]


@router.post(
    "/conversations/{conversation_id}/messages",
    response_model=MessageResponse,
    status_code=201,
)
async def send_message(
    conversation_id: str,
    data: MessageCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    conv = await db.get(Conversation, conversation_id)
    if not conv:
        raise HTTPException(404, "Conversation not found")
    if current_user.id not in (conv.user1_id, conv.user2_id):
        raise HTTPException(403, "Not your conversation")

    msg = Message(
        conversation_id=conversation_id,
        sender_id=current_user.id,
        content=data.content,
    )
    db.add(msg)
    conv.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(msg)

    msg_resp = await _build_message_response(db, msg)

    # Push to the other user
    other_id = conv.user2_id if conv.user1_id == current_user.id else conv.user1_id
    await manager.send_to_user(
        other_id,
        {"type": "new_message", "message": msg_resp.model_dump(mode="json")},
    )

    return msg_resp


# ── WebSocket endpoint ────────────────────────────────────────────────────────

@router.websocket("/ws/{token}")
async def websocket_chat(websocket: WebSocket, token: str):
    # Authenticate via token
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: str = payload.get("sub")
        if not user_id:
            await websocket.close(code=4001)
            return
    except JWTError:
        await websocket.close(code=4001)
        return

    await manager.connect(user_id, websocket)
    try:
        while True:
            raw = await websocket.receive_text()
            data = json.loads(raw)

            if data.get("type") == "message":
                conversation_id = data.get("conversation_id")
                content = data.get("content", "").strip()
                if not conversation_id or not content:
                    continue

                async with async_session() as db:
                    conv = await db.get(Conversation, conversation_id)
                    if not conv or user_id not in (conv.user1_id, conv.user2_id):
                        continue

                    msg = Message(
                        conversation_id=conversation_id,
                        sender_id=user_id,
                        content=content,
                    )
                    db.add(msg)
                    conv.updated_at = datetime.now(timezone.utc)
                    await db.commit()
                    await db.refresh(msg)

                    msg_resp = await _build_message_response(db, msg)
                    payload = {
                        "type": "new_message",
                        "message": msg_resp.model_dump(mode="json"),
                    }

                    other_id = (
                        conv.user2_id if conv.user1_id == user_id else conv.user1_id
                    )
                    await manager.send_to_user(other_id, payload)
                    await manager.send_to_user(user_id, payload)

            elif data.get("type") == "typing":
                conversation_id = data.get("conversation_id")
                if not conversation_id:
                    continue
                async with async_session() as db:
                    conv = await db.get(Conversation, conversation_id)
                    if not conv or user_id not in (conv.user1_id, conv.user2_id):
                        continue
                    other_id = (
                        conv.user2_id if conv.user1_id == user_id else conv.user1_id
                    )
                    await manager.send_to_user(
                        other_id,
                        {
                            "type": "typing",
                            "conversation_id": conversation_id,
                            "user_id": user_id,
                        },
                    )

    except WebSocketDisconnect:
        manager.disconnect(user_id, websocket)
    except Exception:
        manager.disconnect(user_id, websocket)
