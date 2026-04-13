import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base


class FriendRequest(Base):
    __tablename__ = "friend_requests"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    from_user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id"), index=True
    )
    to_user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id"), index=True
    )
    status: Mapped[str] = mapped_column(
        String(20), default="pending"
    )  # pending, accepted, rejected
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc)
    )

    from_user = relationship("User", foreign_keys=[from_user_id])
    to_user = relationship("User", foreign_keys=[to_user_id])
