import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getMyRooms, createRoom, joinRoom, getDiscoverRooms } from '../api'

function RoomList() {
    const [rooms, setRooms] = useState([])
    const [discoverRooms, setDiscoverRooms] = useState([])
    const [newRoomName, setNewRoomName] = useState('')
    const [joinRoomId, setJoinRoomId] = useState('')
    const [error, setError] = useState('')
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
        fetchRooms()
        fetchDiscoverRooms()
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
        <div className="min-h-screen bg-gray-100 p-6">
            <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6 flex flex-col gap-4">
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold">Your Rooms</h1>
                    <button onClick={handleLogout} className="text-sm text-red-500">
                        Log Out
                    </button>
                </div>

                {error && <p className="text-red-500 text-sm">{error}</p>}

                <ul className="flex flex-col gap-2">
                    {rooms.map((room) => (
                        <li key={room.id}>
                            <button
                                onClick={() => navigate(`/rooms/${room.id}`)}
                                className="w-full text-left border rounded px-3 py-2 hover:bg-gray-50"
                            >
                                {room.name || `Room #${room.id}`}
                            </button>
                        </li>
                    ))}
                    {rooms.length === 0 && (
                        <p className="text-gray-500 text-sm text-center">No rooms yet.</p>
                    )}
                </ul>

                <form onSubmit={handleCreate} className="flex gap-2">
                    <input
                        type="text"
                        placeholder="New room name"
                        value={newRoomName}
                        onChange={(e) => setNewRoomName(e.target.value)}
                        className="border rounded px-3 py-2 flex-1"
                    />
                    <button type="submit" className="bg-blue-600 text-white rounded px-4 hover:bg-blue-700">
                        Create
                    </button>
                </form>

                <form onSubmit={handleJoin} className="flex gap-2">
                    <input
                        type="text"
                        placeholder="Room ID to join"
                        value={joinRoomId}
                        onChange={(e) => setJoinRoomId(e.target.value)}
                        className="border rounded px-3 py-2 flex-1"
                    />
                    <button type="submit" className="bg-gray-600 text-white rounded px-4 hover:bg-gray-700">
                        Join
                    </button>
                </form>

                <hr className="my-2" />

                <h2 className="text-lg font-semibold">Discover Rooms</h2>
                <ul className="flex flex-col gap-2">
                    {discoverRooms.map((room) => (
                        <li key={room.id} className="flex justify-between items-center border rounded px-3 py-2">
                            <span>{room.name || `Room #${room.id}`}</span>
                            <button
                                onClick={() => handleDiscoverJoin(room.id)}
                                className="text-sm bg-green-600 text-white rounded px-3 py-1 hover:bg-green-700"
                            >
                                Join
                            </button>
                        </li>
                    ))}
                    {discoverRooms.length === 0 && (
                        <p className="text-gray-500 text-sm text-center">No rooms to discover.</p>
                    )}
                </ul>
            </div>
        </div>
    )
}

export default RoomList