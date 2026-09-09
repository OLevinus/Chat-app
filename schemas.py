from pydantic import BaseModel
from datetime import datetime
from typing import Optional

# USER SCHEMAS


class UserBase(BaseModel):
    username: str
    email: str


class UserCreate(UserBase):
    password: str


class UserRead(UserBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# ROOM SCHEMAS


class RoomBase(BaseModel):
    name: Optional[str] = None
    is_direct: int = 0


class RoomCreate(RoomBase):
    pass


class RoomRead(RoomBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

# ROOM MEMBER SCHEMAS


class RoomMemberBase(BaseModel):
    room_id: int
    user_id: int


class RoomMemberCreate(RoomMemberBase):
    pass


class RoomMemberRead(RoomMemberBase):
    id: int
    joined_at: datetime

    class Config:
        from_attributes = True

# MESSAGE SCHEMAS


class MessageBase(BaseModel):
    content: str


class MessageCreate(MessageBase):
    room_id: int


class MessageRead(MessageBase):
    id: int
    room_id: int
    sender_id: int
    created_at: datetime

    class Config:
        from_attributes = True
