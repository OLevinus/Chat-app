from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import SessionLocal
from models import Room, RoomMember, Message, User
from schemas import RoomCreate, RoomRead, MessageRead, RoomMemberInfo
from auth import get_current_user

router = APIRouter(prefix="/rooms", tags=["rooms"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/", response_model=RoomRead)
def create_room(room: RoomCreate, db: Session = Depends(get_db),
                current_user: User = Depends(get_current_user)):
    new_room = Room(name=room.name, is_direct=room.is_direct)
    db.add(new_room)
    db.commit()
    db.refresh(new_room)

    membership = RoomMember(user_id=current_user.id, room_id=new_room.id)
    db.add(membership)
    db.commit()
    return new_room


@router.get("/", response_model=list[RoomRead])
def list_my_rooms(db: Session = Depends(get_db),
                  current_user: User = Depends(get_current_user)):
    memberships = db.query(RoomMember).filter(
        RoomMember.user_id == current_user.id).all()
    room_ids = [m.room_id for m in memberships]
    return db.query(Room).filter(Room.id.in_(room_ids)).all()


@router.post("/{room_id}/join")
def join_room(room_id: int, db: Session = Depends(get_db),
              current_user: User = Depends(get_current_user)):
    room = db.query(Room).filter(Room.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")

    existing = db.query(RoomMember).filter_by(
        user_id=current_user.id, room_id=room_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Already a member")

    db.add(RoomMember(user_id=current_user.id, room_id=room_id))
    db.commit()
    return {"detail": "joined"}


@router.get("/{room_id}/messages", response_model=list[MessageRead])
def get_messages(room_id: int, db: Session = Depends(get_db),
                 current_user: User = Depends(get_current_user)):
    member = db.query(RoomMember).filter_by(
        user_id=current_user.id, room_id=room_id).first()
    if not member:
        raise HTTPException(
            status_code=403, detail="Not a member of this room")
    rows = (
        db.query(Message, User.username)
        .join(User, Message.sender_id == User.id)
        .filter(Message.room_id == room_id)
        .order_by(Message.created_at)
        .all()
    )

    return [
        {
            "id": msg.id,
            "room_id": msg.room_id,
            "sender_id": msg.sender_id,
            "sender": username,
            "content": msg.content,
            "created_at": msg.created_at,
        }
        for msg, username in rows
    ]


@router.get("/{room_id}/members", response_model=list[RoomMemberInfo])
def list_room_members(room_id: int, db: Session = Depends(get_db),
                      current_user: User = Depends(get_current_user)):
    is_member = db.query(RoomMember).filter_by(
        user_id=current_user.id, room_id=room_id).first()
    if not is_member:
        raise HTTPException(
            status_code=403, detail="Not a member of this room")

    members = (
        db.query(User)
        .join(RoomMember, RoomMember.user_id == User.id)
        .filter(RoomMember.room_id == room_id)
        .all()
    )
    return members


@router.delete("/{room_id}/leave")
def leave_room(room_id: int, db: Session = Depends(get_db),
               current_user: User = Depends(get_current_user)):
    membership = db.query(RoomMember).filter_by(
        user_id=current_user.id, room_id=room_id).first()
    if not membership:
        raise HTTPException(
            status_code=400, detail="You are not a member of this room")

    db.delete(membership)
    db.commit()
    return {"detail": "left room"}


@router.get("/discover", response_model=list[RoomRead])
def discover_rooms(db: Session = Depends(get_db),
                   current_user: User = Depends(get_current_user)):
    my_room_ids = [
        m.room_id for m in db.query(RoomMember).filter_by(user_id=current_user.id).all()
    ]
    return (
        db.query(Room)
        .filter(Room.is_direct == 0)
        .filter(~Room.id.in_(my_room_ids))
        .all()
    )


@router.get("/{room_id}", response_model=RoomRead)
def get_room(room_id: int, db: Session = Depends(get_db),
             current_user: User = Depends(get_current_user)):
    member = db.query(RoomMember).filter_by(
        user_id=current_user.id, room_id=room_id).first()
    if not member:
        raise HTTPException(
            status_code=403, detail="Not a member of this room")

    room = db.query(Room).filter(Room.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    return room
