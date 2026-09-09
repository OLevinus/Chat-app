from fastapi import FastAPI, Depends, HTTPException, status, WebSocket, WebSocketDisconnect, Query
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from jose import jwt, JWTError

from database import SessionLocal
from models import User, Message
import schemas
from auth import verify_password, create_access_token, get_current_user, SECRET_KEY, ALGORITHM
from routers import rooms

app = FastAPI()
app.include_router(rooms.router)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@app.post("/register", response_model=schemas.UserRead)
def register_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(
        (User.username == user.username) | (User.email == user.email)
    ).first()

    if existing_user:
        raise HTTPException(
            status_code=400, detail="Username or email already registered")

    hashed_password = pwd_context.hash(user.password)
    new_user = User(username=user.username,
                    email=user.email, hashed_password=hashed_password)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


@app.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == form_data.username).first()

    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(data={"sub": user.username})

    return {"access_token": access_token, "token_type": "bearer"}


@app.get("/me")
def read_current_user(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "username": current_user.username,
        "email": current_user.email,
    }


class ConnectionManager:
    def __init__(self):
        self.active: dict[int, list[WebSocket]] = {}

    async def connect(self, room_id: int, websocket: WebSocket):
        await websocket.accept()
        self.active.setdefault(room_id, []).append(websocket)

    def disconnect(self, room_id: int, websocket: WebSocket):
        self.active[room_id].remove(websocket)

    async def broadcast(self, room_id: int, message: dict):
        for connection in self.active.get(room_id, []):
            await connection.send_json(message)


manager = ConnectionManager()


def get_user_from_token(token: str, db: Session) -> User:
    payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    username = payload.get("sub")
    return db.query(User).filter(User.username == username).first()


@app.websocket("/ws/{room_id}")
async def websocket_endpoint(websocket: WebSocket, room_id: int, token: str = Query(...)):
    db = SessionLocal()
    try:
        user = get_user_from_token(token, db)
    except JWTError:
        await websocket.close(code=1008)
        return

    await manager.connect(room_id, websocket)
    try:
        while True:
            data = await websocket.receive_text()
            msg = Message(content=data, sender_id=user.id, room_id=room_id)
            db.add(msg)
            db.commit()
            db.refresh(msg)
            await manager.broadcast(room_id, {
                "sender": user.username,
                "content": msg.content,
                "created_at": msg.created_at.isoformat(),
            })
    except WebSocketDisconnect:
        manager.disconnect(room_id, websocket)
    finally:
        db.close()
