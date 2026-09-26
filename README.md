# Chat App

A real-time multi-user chat application built with FastAPI, WebSockets, and React.

**Live demo:** [Frontend]([https://backend-gamma-pied-18.vercel.app]) · [Backend API](https://chat-app-1-u2ej.onrender.com)

## Features

- User registration and login with JWT authentication
- Password hashing with bcrypt
- Create, discover, and join chat rooms
- Real-time messaging via native WebSockets
- Membership-based access control (only room members can connect to a room's socket)
- Message history with sender info and timestamps
- Auto-reconnect on dropped WebSocket connections
- Message grouping by sender, scroll-to-bottom button, enter-to-send
- Leave or delete a room (with confirmation)
- Toast-style error notifications

## Tech Stack

**Backend**
- FastAPI
- Native WebSockets (no Socket.IO)
- SQLAlchemy + PostgreSQL (hosted on [Neon](https://neon.tech))
- JWT auth via `python-jose`, password hashing via `passlib[bcrypt]`

**Frontend**
- React (Vite)
- Tailwind CSS
- React Router

**Deployment**
- Backend: [Render](https://render.com)
- Frontend: [Vercel](https://vercel.com)

## Architecture

```
User → Register/Login → JWT issued
     → Create/Join Room → RoomMember record created
     → Connect to WebSocket → membership verified → real-time messaging
```

Data model: `users`, `rooms` (with `is_direct` flag for DMs vs. group chats), `room_members` (join table), `messages`.


## Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+
- A PostgreSQL database (e.g. a free [Neon](https://neon.tech) instance)

### Backend setup

```bash
cd backend
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # macOS/Linux

pip install -r requirements.txt
```

Create a `.env` file in `backend/`:

```
DATABASE_URL=postgresql://<user>:<password>@<host>/<db>
SECRET_KEY=<your-generated-secret-key>
```

Create the tables, then run the server:

```bash
python create_tables.py
uvicorn main:app --reload
```

API docs available at `http://localhost:8000/docs`.

### Frontend setup

```bash
cd frontend
npm install
```

Create a `.env` file in `frontend/`:

```
VITE_API_BASE_URL=http://localhost:8000
VITE_WS_BASE_URL=ws://localhost:8000
```

```bash
npm run dev
```

## Project Structure

```
chat-app/
├── backend/
│   ├── main.py           # FastAPI app, routers
│   ├── models.py         # SQLAlchemy models: User, Room, RoomMember, Message
│   ├── schemas.py        # Pydantic schemas
│   ├── auth.py           # Password hashing, JWT, get_current_user
│   ├── database.py       # Engine, SessionLocal, Base
|   |-- rooms.py          # Router, Rooms
|   |-- checktables.py    # 
│   └── create_tables.py  # Table creation script
|   
└── frontend/
    └── src/
        ├── pages/
        │   ├── Login.jsx
        │   ├── Register.jsx
        │   ├── RoomList.jsx
        │   └── ChatRoom.jsx
        └── api.js        # Shared API call helpers
```


