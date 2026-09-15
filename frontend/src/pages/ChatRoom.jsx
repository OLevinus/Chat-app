import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getRoomMessages, leaveRoom, getRoom } from '../api'

function ChatRoom() {
    const { roomId } = useParams()
    const navigate = useNavigate()
    const [room, setRoom] = useState(null)
    const [messages, setMessages] = useState([])
    const [input, setInput] = useState('')
    const [error, setError] = useState('')
    const [connected, setConnected] = useState(false)
    const [loading, setLoading] = useState(true)
    const ws = useRef(null)
    const bottomRef = useRef(null)
    const inputRef = useRef(null)

    const currentUser = JSON.parse(localStorage.getItem('user') || 'null')

    useEffect(() => {
        const loadRoom = async () => {
            try {
                const res = await getRoom(roomId)
                setRoom(res.data)
            } catch (err) {
                // room name is non-critical, fail silently and fall back to Room #id
            }
        }
        loadRoom()

        const loadHistory = async () => {
            try {
                const res = await getRoomMessages(roomId)
                setMessages(res.data)
            } catch (err) {
                setError('Could not load messages (are you a member of this room?)')
            } finally {
                setLoading(false)
            }
        }
        loadHistory()

        const token = localStorage.getItem('token')
        const socket = new WebSocket(`ws://127.0.0.1:8000/ws/${roomId}?token=${token}`)
        ws.current = socket

        socket.onopen = () => setConnected(true)

        socket.onmessage = (event) => {
            const data = JSON.parse(event.data)
            setMessages((prev) => [...prev, data])
        }

        socket.onclose = () => {
            setConnected(false)
        }

        return () => {
            socket.close()
        }
    }, [roomId])

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    useEffect(() => {
        inputRef.current?.focus()
    }, [])

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

    const formatTime = (ts) => {
        if (!ts) return ''
        return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    const getInitial = (name) => (name ? name.charAt(0).toUpperCase() : '?')

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex flex-col">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 px-6 py-3.5 flex justify-between items-center shrink-0">
                <button
                    onClick={() => navigate('/rooms')}
                    className="text-slate-500 hover:text-slate-800 text-sm font-medium transition-colors flex items-center gap-1"
                >
                    ← Back
                </button>
                <div className="flex items-center gap-2">
                    <h1 className="font-semibold text-slate-800">
                        {room?.name || `Room #${roomId}`}
                    </h1>
                    <span
                        className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-500' : 'bg-slate-300'}`}
                        title={connected ? 'Connected' : 'Disconnected'}
                    />
                </div>
                <button
                    onClick={handleLeave}
                    className="text-red-500 hover:text-red-600 text-sm font-medium transition-colors"
                >
                    Leave
                </button>
            </div>

            {error && (
                <div className="bg-red-50 border-b border-red-100 px-4 py-2">
                    <p className="text-red-600 text-sm text-center">{error}</p>
                </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-6 flex flex-col gap-3">
                {loading ? (
                    <p className="text-center text-slate-400 text-sm mt-10">Loading messages…</p>
                ) : messages.length === 0 ? (
                    <p className="text-center text-slate-400 text-sm mt-10">
                        No messages yet — say hi 👋
                    </p>
                ) : (
                    messages.map((msg, i) => {
                        const isMine = msg.sender === currentUser?.username || msg.sender_id === currentUser?.id
                        const senderLabel = msg.sender || msg.sender_id

                        return (
                            <div
                                key={i}
                                className={`flex items-end gap-2 ${isMine ? 'self-end flex-row-reverse' : 'self-start'}`}
                            >
                                {!isMine && (
                                    <div className="w-7 h-7 rounded-full bg-slate-300 text-white text-xs flex items-center justify-center shrink-0 font-medium">
                                        {getInitial(senderLabel)}
                                    </div>
                                )}
                                <div
                                    className={`max-w-xs sm:max-w-sm px-3.5 py-2 rounded-2xl shadow-sm ${isMine
                                        ? 'bg-blue-600 text-white rounded-br-sm'
                                        : 'bg-white text-slate-800 rounded-bl-sm border border-slate-100'
                                        }`}
                                >
                                    {!isMine && (
                                        <p className="text-xs font-semibold text-slate-500 mb-0.5">
                                            {senderLabel}
                                        </p>
                                    )}
                                    <p className="text-sm break-words">{msg.content}</p>
                                    {msg.created_at && (
                                        <p className={`text-[10px] mt-1 ${isMine ? 'text-blue-100' : 'text-slate-400'}`}>
                                            {formatTime(msg.created_at)}
                                        </p>
                                    )}
                                </div>
                            </div>
                        )
                    })
                )}
                <div ref={bottomRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="bg-white border-t border-slate-200 p-3 flex gap-2 shrink-0">
                <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 border border-slate-200 bg-slate-50 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                />
                <button
                    type="submit"
                    disabled={!input.trim()}
                    className="bg-blue-600 text-white rounded-full px-5 text-sm font-medium hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
                >
                    Send
                </button>
            </form>
        </div>
    )
}

export default ChatRoom