import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getRoomMessages, leaveRoom } from '../api'

function ChatRoom() {
    const { roomId } = useParams()
    const navigate = useNavigate()
    const [messages, setMessages] = useState([])
    const [input, setInput] = useState('')
    const [error, setError] = useState('')
    const ws = useRef(null)
    const bottomRef = useRef(null)

    const currentUser = JSON.parse(localStorage.getItem('user') || 'null')

    useEffect(() => {
        // Load message history first
        const loadHistory = async () => {
            try {
                const res = await getRoomMessages(roomId)
                setMessages(res.data)
            } catch (err) {
                setError('Could not load messages (are you a member of this room?)')
            }
        }
        loadHistory()

        // Then open the WebSocket for live messages
        const token = localStorage.getItem('token')
        const socket = new WebSocket(`ws://127.0.0.1:8000/ws/${roomId}?token=${token}`)
        ws.current = socket

        socket.onmessage = (event) => {
            const data = JSON.parse(event.data)
            setMessages((prev) => [...prev, data])
        }

        socket.onclose = () => {
            // 1008 = policy violation, used by backend for auth/membership failures
        }

        return () => {
            socket.close()
        }
    }, [roomId])

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    const handleSend = (e) => {
        e.preventDefault()
        if (!input.trim()) return
        if (ws.current && ws.current.readyState === WebSocket.OPEN) {
            ws.current.send(input)
            setInput('')
        }
    }

    const handleLeave = async () => {
        try {
            await leaveRoom(roomId)
            navigate('/rooms')
        } catch (err) {
            setError('Could not leave room')
        }
    }

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col">
            <div className="bg-white shadow px-6 py-4 flex justify-between items-center">
                <button onClick={() => navigate('/rooms')} className="text-blue-600 text-sm">
                    ← Back
                </button>
                <h1 className="font-bold">Room #{roomId}</h1>
                <button onClick={handleLeave} className="text-red-500 text-sm">
                    Leave
                </button>
            </div>

            {error && <p className="text-red-500 text-sm text-center mt-2">{error}</p>}

            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
                {messages.map((msg, i) => {
                    const isMine = msg.sender === currentUser?.username || msg.sender_id === currentUser?.id
                    return (
                        <div
                            key={i}
                            className={`max-w-xs px-3 py-2 rounded-lg ${isMine ? 'bg-blue-600 text-white self-end' : 'bg-white self-start'
                                }`}
                        >
                            {!isMine && (
                                <p className="text-xs font-semibold text-gray-500">
                                    {msg.sender || msg.sender_id}
                                </p>
                            )}
                            <p>{msg.content}</p>
                        </div>
                    )
                })}
                <div ref={bottomRef} />
            </div>

            <form onSubmit={handleSend} className="bg-white p-4 flex gap-2">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 border rounded px-3 py-2"
                />
                <button type="submit" className="bg-blue-600 text-white rounded px-4 hover:bg-blue-700">
                    Send
                </button>
            </form>
        </div>
    )
}

export default ChatRoom