from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, or_, and_
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models.friendship import FriendRequest
from models.user import User
from schemas.friendship import FriendRequestCreate, FriendRequestResponse, FriendResponse
from utils.auth import get_current_user

router = APIRouter(prefix="/friends", tags=["Friends"])


async def _build_request_response(
    db: AsyncSession, fr: FriendRequest
) -> FriendRequestResponse:
    from_user = await db.get(User, fr.from_user_id)
    to_user = await db.get(User, fr.to_user_id)
    return FriendRequestResponse(
        id=fr.id,
        from_user_id=fr.from_user_id,
        to_user_id=fr.to_user_id,
        status=fr.status,
        created_at=fr.created_at,
        from_username=from_user.username if from_user else "deleted",
        from_avatar=from_user.avatar_url if from_user else None,
        to_username=to_user.username if to_user else "deleted",
        to_avatar=to_user.avatar_url if to_user else None,
    )


@router.post("/request", response_model=FriendRequestResponse, status_code=201)
async def send_friend_request(
    data: FriendRequestCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if data.to_user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot send request to yourself")

    target = await db.get(User, data.to_user_id)
    if not target:
        raise HTTPException(status_code=404, detail="User not found")

    existing = await db.execute(
        select(FriendRequest).where(
            or_(
                and_(
                    FriendRequest.from_user_id == current_user.id,
                    FriendRequest.to_user_id == data.to_user_id,
                ),
                and_(
                    FriendRequest.from_user_id == data.to_user_id,
                    FriendRequest.to_user_id == current_user.id,
                ),
            ),
            FriendRequest.status.in_(["pending", "accepted"]),
        )
    )
    existing_fr = existing.scalar_one_or_none()
    if existing_fr:
        if existing_fr.status == "accepted":
            raise HTTPException(status_code=400, detail="Already friends")
        # Return existing pending request instead of erroring
        return await _build_request_response(db, existing_fr)

    # Also clean up any old rejected requests so user can re-send
    old_rejected = await db.execute(
        select(FriendRequest).where(
            FriendRequest.from_user_id == current_user.id,
            FriendRequest.to_user_id == data.to_user_id,
            FriendRequest.status == "rejected",
        )
    )
    for old in old_rejected.scalars().all():
        await db.delete(old)

    fr = FriendRequest(from_user_id=current_user.id, to_user_id=data.to_user_id)
    db.add(fr)
    await db.commit()
    await db.refresh(fr)
    return await _build_request_response(db, fr)


@router.get("/requests/received", response_model=list[FriendRequestResponse])
async def get_received_requests(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(FriendRequest).where(
            FriendRequest.to_user_id == current_user.id,
            FriendRequest.status == "pending",
        )
    )
    requests = result.scalars().all()
    return [await _build_request_response(db, fr) for fr in requests]


@router.get("/requests/sent", response_model=list[FriendRequestResponse])
async def get_sent_requests(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(FriendRequest).where(
            FriendRequest.from_user_id == current_user.id,
            FriendRequest.status == "pending",
        )
    )
    requests = result.scalars().all()
    return [await _build_request_response(db, fr) for fr in requests]


@router.put("/requests/{request_id}/accept", response_model=FriendRequestResponse)
async def accept_request(
    request_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    fr = await db.get(FriendRequest, request_id)
    if not fr or fr.to_user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Request not found")
    if fr.status != "pending":
        raise HTTPException(status_code=400, detail="Request already processed")

    fr.status = "accepted"
    await db.commit()
    await db.refresh(fr)
    return await _build_request_response(db, fr)


@router.put("/requests/{request_id}/reject", response_model=FriendRequestResponse)
async def reject_request(
    request_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    fr = await db.get(FriendRequest, request_id)
    if not fr or fr.to_user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Request not found")
    if fr.status != "pending":
        raise HTTPException(status_code=400, detail="Request already processed")

    fr.status = "rejected"
    await db.commit()
    await db.refresh(fr)
    return await _build_request_response(db, fr)


@router.delete("/requests/{request_id}/cancel", status_code=204)
async def cancel_request(
    request_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    fr = await db.get(FriendRequest, request_id)
    if not fr or fr.from_user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Request not found")
    if fr.status != "pending":
        raise HTTPException(status_code=400, detail="Request already processed")
    await db.delete(fr)
    await db.commit()


@router.get("/status/{user_id}")
async def get_friendship_status(
    user_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Check friendship status with another user: none, pending_sent, pending_received, friends"""
    result = await db.execute(
        select(FriendRequest).where(
            or_(
                and_(
                    FriendRequest.from_user_id == current_user.id,
                    FriendRequest.to_user_id == user_id,
                ),
                and_(
                    FriendRequest.from_user_id == user_id,
                    FriendRequest.to_user_id == current_user.id,
                ),
            ),
            FriendRequest.status.in_(["pending", "accepted"]),
        )
    )
    fr = result.scalar_one_or_none()
    if not fr:
        return {"status": "none", "request_id": None}
    if fr.status == "accepted":
        return {"status": "friends", "request_id": fr.id}
    if fr.from_user_id == current_user.id:
        return {"status": "pending_sent", "request_id": fr.id}
    return {"status": "pending_received", "request_id": fr.id}


@router.get("", response_model=list[FriendResponse])
async def get_friends(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(FriendRequest).where(
            FriendRequest.status == "accepted",
            or_(
                FriendRequest.from_user_id == current_user.id,
                FriendRequest.to_user_id == current_user.id,
            ),
        )
    )
    friend_requests = result.scalars().all()

    friends = []
    for fr in friend_requests:
        friend_id = (
            fr.to_user_id if fr.from_user_id == current_user.id else fr.from_user_id
        )
        user = await db.get(User, friend_id)
        if user:
            friends.append(
                FriendResponse(
                    id=user.id,
                    username=user.username,
                    full_name=user.full_name,
                    avatar_url=user.avatar_url,
                )
            )
    return friends


@router.delete("/{user_id}", status_code=204)
async def remove_friend(
    user_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(FriendRequest).where(
            FriendRequest.status == "accepted",
            or_(
                and_(
                    FriendRequest.from_user_id == current_user.id,
                    FriendRequest.to_user_id == user_id,
                ),
                and_(
                    FriendRequest.from_user_id == user_id,
                    FriendRequest.to_user_id == current_user.id,
                ),
            ),
        )
    )
    fr = result.scalar_one_or_none()
    if not fr:
        raise HTTPException(status_code=404, detail="Not friends")
    await db.delete(fr)
    await db.commit()
