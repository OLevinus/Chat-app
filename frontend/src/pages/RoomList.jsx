import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getMyRooms, createRoom, joinRoom, getDiscoverRooms } from '../api'

function RoomList() {
    const [rooms, setRooms] = useState([])
    const [discoverRooms, setDiscoverRooms] = useState([])
    const [newRoomName, setNewRoomName] = useState('')
    const [joinRoomId, setJoinRoomId] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(true)
    const navigate = useNavigate()

    const fetchRooms = async () => {
        try {
            const res = await getMyRooms()
            setRooms(res.data)
        } catch (err) {
            setError('Could not load rooms')
        }
    }

    const fetchDiscoverRooms = async () => {
        try {
            const res = await getDiscoverRooms()
            setDiscoverRooms(res.data)
        } catch (err) {
            setError('Could not load discoverable rooms')
        }
    }

    useEffect(() => {
        Promise.all([fetchRooms(), fetchDiscoverRooms()]).finally(() => setLoading(false))
    }, [])

    const handleCreate = async (e) => {
        e.preventDefault()
        if (!newRoomName.trim()) return
        try {
            await createRoom(newRoomName)
            setNewRoomName('')
            fetchRooms()
            fetchDiscoverRooms()
        } catch (err) {
            setError('Could not create room')
        }
    }

    const handleJoin = async (e) => {
        e.preventDefault()
        if (!joinRoomId.trim()) return
        try {
            await joinRoom(joinRoomId)
            setJoinRoomId('')
            fetchRooms()
            fetchDiscoverRooms()
        } catch (err) {
            const detail = err.response?.data?.detail
            setError(detail || 'Could not join room')
        }
    }

    const handleDiscoverJoin = async (roomId) => {
        try {
            await joinRoom(roomId)
            fetchRooms()
            fetchDiscoverRooms()
        } catch (err) {
            const detail = err.response?.data?.detail
            setError(detail || 'Could not join room')
        }
    }

    const handleLogout = () => {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        navigate('/login')
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 p-6">
            <div className="max-w-md mx-auto bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col gap-5">
                <div className="flex justify-between items-center">
                    <h1 className="text-xl font-semibold text-slate-800">Your Rooms</h1>
                    <button
                        onClick={handleLogout}
                        className="text-sm text-red-500 hover:text-red-600 font-medium transition-colors"
                    >
                        Log Out
                    </button>
                </div>

                {error && (
                    <p className="text-red-500 text-sm bg-red-50 rounded-lg px-3 py-2">{error}</p>
                )}

                <div>
                    <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
                        Joined
                    </h2>
                    {loading ? (
                        <p className="text-slate-400 text-sm text-center py-4">Loading rooms…</p>
                    ) : (
                        <ul className="flex flex-col gap-1.5">
                            {rooms.map((room) => (
                                <li key={room.id}>
                                    <button
                                        onClick={() => navigate(`/rooms/${room.id}`)}
                                        className="w-full text-left rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 border border-slate-100 transition-colors"
                                    >
                                        {room.name || `Room #${room.id}`}
                                    </button>
                                </li>
                            ))}
                            {rooms.length === 0 && (
                                <p className="text-slate-400 text-sm text-center py-4">No rooms yet.</p>
                            )}
                        </ul>
                    )}
                </div>

                <form onSubmit={handleCreate} className="flex gap-2">
                    <input
                        type="text"
                        placeholder="New room name"
                        value={newRoomName}
                        onChange={(e) => setNewRoomName(e.target.value)}
                        className="border border-slate-200 bg-slate-50 rounded-full px-4 py-2 flex-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                    />
                    <button
                        type="submit"
                        disabled={!newRoomName.trim()}
                        className="bg-blue-600 text-white rounded-full px-4 text-sm font-medium hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
                    >
                        Create
                    </button>
                </form>

                <form onSubmit={handleJoin} className="flex gap-2">
                    <input
                        type="text"
                        placeholder="Room ID to join"
                        value={joinRoomId}
                        onChange={(e) => setJoinRoomId(e.target.value)}
                        className="border border-slate-200 bg-slate-50 rounded-full px-4 py-2 flex-1 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 focus:bg-white transition"
                    />
                    <button
                        type="submit"
                        disabled={!joinRoomId.trim()}
                        className="bg-slate-700 text-white rounded-full px-4 text-sm font-medium hover:bg-slate-800 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
                    >
                        Join
                    </button>
                </form>

                <hr className="border-slate-100" />

                <div>
                    <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
                        Discover
                    </h2>
                    <ul className="flex flex-col gap-1.5">
                        {discoverRooms.map((room) => (
                            <li
                                key={room.id}
                                className="flex justify-between items-center rounded-xl px-3.5 py-2 border border-slate-100"
                            >
                                <span className="text-sm text-slate-700">
                                    {room.name || `Room #${room.id}`}
                                </span>
                                <button
                                    onClick={() => handleDiscoverJoin(room.id)}
                                    className="text-xs font-medium bg-emerald-600 text-white rounded-full px-3 py-1.5 hover:bg-emerald-700 transition-colors"
                                >
                                    Join
                                </button>
                            </li>
                        ))}
                        {discoverRooms.length === 0 && (
                            <p className="text-slate-400 text-sm text-center py-4">No rooms to discover.</p>
                        )}
                    </ul>
                </div>
            </div>
        </div>
    )
}

export default RoomList