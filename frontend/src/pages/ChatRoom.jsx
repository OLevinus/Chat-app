import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getRoomMessages, leaveRoom, getRoom, getRoomMembers } from '../api'
import Toast from '../components/Toast'

function ChatRoom() {
    const { roomId } = useParams()
    const navigate = useNavigate()
    const [room, setRoom] = useState(null)
    const [messages, setMessages] = useState([])
    const [members, setMembers] = useState([])
    const [showMembers, setShowMembers] = useState(false)
    const [input, setInput] = useState('')
    const [toasts, setToasts] = useState([])
    const [connected, setConnected] = useState(false)
    const [loading, setLoading] = useState(true)
    const [showScrollButton, setShowScrollButton] = useState(false)
    const ws = useRef(null)
    const bottomRef = useRef(null)
    const containerRef = useRef(null)
    const inputRef = useRef(null)
    const reconnectAttempts = useRef(0)
    const reconnectTimer = useRef(null)
    const isClosingRef = useRef(false)
    const forceScrollRef = useRef(false)

    const currentUser = JSON.parse(localStorage.getItem('user') || 'null')

    const pushToast = useCallback((message) => {
        const id = Date.now() + Math.random()
        setToasts((prev) => [...prev, { id, message }])
    }, [])

    const removeToast = (id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
    }

    const connectWebSocket = useCallback(() => {
        const token = localStorage.getItem('token')
        const socket = new WebSocket(`ws://127.0.0.1:8000/ws/${roomId}?token=${token}`)
        ws.current = socket
        isClosingRef.current = false

        socket.onopen = () => {
            setConnected(true)
            reconnectAttempts.current = 0
        }

        socket.onmessage = (event) => {
            const data = JSON.parse(event.data)
            setMessages((prev) => [...prev, data])
        }

        socket.onclose = (event) => {
            // ignore stale sockets — ws.current has already moved on to a newer connection
            if (ws.current !== socket || isClosingRef.current) return

            setConnected(false)
            if (event.code === 1008) {
                pushToast('You are no longer a member of this room')
                return
            }
            const delay = Math.min(1000 * 2 ** reconnectAttempts.current, 10000)
            reconnectAttempts.current += 1
            reconnectTimer.current = setTimeout(connectWebSocket, delay)
        }

        socket.onerror = () => socket.close()
    }, [roomId, pushToast])

    useEffect(() => {
        const loadRoom = async () => {
            try {
                const res = await getRoom(roomId)
                setRoom(res.data)
            } catch (err) {
                // room name is non-critical, fail silently
            }
        }
        loadRoom()

        const loadMembers = async () => {
            try {
                const res = await getRoomMembers(roomId)
                setMembers(res.data)
            } catch (err) {
                // member list is non-critical, fail silently
            }
        }
        loadMembers()

        const loadHistory = async () => {
            try {
                const res = await getRoomMessages(roomId)
                setMessages(res.data)
            } catch (err) {
                pushToast('Could not load messages (are you a member of this room?)')
            } finally {
                setLoading(false)
            }
        }
        loadHistory()

        connectWebSocket()

        return () => {
            isClosingRef.current = true
            clearTimeout(reconnectTimer.current)
            ws.current?.close()
            ws.current = null
        }
    }, [roomId, connectWebSocket, pushToast])

    useEffect(() => {
        const el = containerRef.current
        if (!el) return
        const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 150
        if (nearBottom || forceScrollRef.current) {
            forceScrollRef.current = false
            requestAnimationFrame(() => {
                bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
            })
        }
    }, [messages])

    useEffect(() => {
        inputRef.current?.focus()
    }, [])

    const handleScroll = () => {
        const el = containerRef.current
        if (!el) return
        const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 150
        setShowScrollButton(!nearBottom)
    }

    const scrollToBottom = () => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    const handleSend = (e) => {
        e.preventDefault()
        if (!input.trim()) return
        if (ws.current && ws.current.readyState === WebSocket.OPEN) {
            forceScrollRef.current = true
            ws.current.send(input)
            setInput('')
        } else {
            pushToast('Not connected — trying to reconnect...')
        }
    }

    const handleLeave = async () => {
        try {
            await leaveRoom(roomId)
            navigate('/rooms')
        } catch (err) {
            pushToast('Could not leave room')
        }
    }

    const formatTime = (ts) => {
        if (!ts) return ''
        return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    const getInitial = (name) => {
        if (!name || typeof name !== 'string') return '?'
        return name.charAt(0).toUpperCase()
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex flex-col">
            <div className="fixed top-0 right-0 p-4 flex flex-col gap-2 z-50">
                {toasts.map((t) => (
                    <Toast key={t.id} message={t.message} onClose={() => removeToast(t.id)} />
                ))}
            </div>

            {/* Header */}
            <div className="bg-white border-b border-slate-200 px-6 py-3.5 flex justify-between items-center shrink-0 relative">
                <button
                    onClick={() => navigate('/rooms')}
                    className="text-slate-500 hover:text-slate-800 text-sm font-medium transition-colors flex items-center gap-1"
                >
                    ← Back
                </button>
                <div className="flex items-center gap-2 relative">
                    <button
                        onClick={() => setShowMembers((s) => !s)}
                        className="font-semibold text-slate-800 hover:text-blue-600 transition-colors"
                    >
                        {room?.name || `Room #${roomId}`}
                    </button>
                    <span
                        className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-500' : 'bg-slate-300'}`}
                        title={connected ? 'Connected' : 'Reconnecting...'}
                    />
                    {showMembers && (
                        <div className="absolute top-8 left-1/2 -translate-x-1/2 bg-white border border-slate-200 rounded-lg shadow-lg py-2 w-48 z-40">
                            <p className="text-xs font-semibold text-slate-400 px-3 pb-1 uppercase">
                                Members ({members.length})
                            </p>
                            {members.map((m) => (
                                <div key={m.id} className="px-3 py-1.5 text-sm text-slate-700 flex items-center gap-2">
                                    <div className="w-5 h-5 rounded-full bg-slate-300 text-white text-[10px] flex items-center justify-center font-medium">
                                        {getInitial(m.username)}
                                    </div>
                                    {m.username}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <button
                    onClick={handleLeave}
                    className="text-red-500 hover:text-red-600 text-sm font-medium transition-colors"
                >
                    Leave
                </button>
            </div>

            {/* Messages */}
            <div
                ref={containerRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto px-4 py-6 flex flex-col gap-1 relative"
            >
                {loading ? (
                    <p className="text-center text-slate-400 text-sm mt-10">Loading messages…</p>
                ) : messages.length === 0 ? (
                    <p className="text-center text-slate-400 text-sm mt-10">
                        No messages yet — say hi 👋
                    </p>
                ) : (
                    messages.map((msg, i) => {
                        const isMine = msg.sender === currentUser?.username || msg.sender_id === currentUser?.id
                        const senderLabel = (typeof msg.sender === 'string' && msg.sender) ? msg.sender : 'Unknown'

                        const prev = messages[i - 1]
                        const prevSenderId = prev?.sender_id ?? prev?.sender
                        const currSenderId = msg.sender_id ?? msg.sender
                        const isGrouped =
                            prev &&
                            prevSenderId === currSenderId &&
                            msg.created_at && prev.created_at &&
                            new Date(msg.created_at) - new Date(prev.created_at) < 5 * 60 * 1000

                        return (
                            <div
                                key={i}
                                className={`flex items-end gap-2 ${isMine ? 'self-end flex-row-reverse' : 'self-start'} ${isGrouped ? 'mt-0.5' : 'mt-2'}`}
                            >
                                {!isMine && (
                                    <div className="w-7 h-7 shrink-0">
                                        {!isGrouped && (
                                            <div className="w-7 h-7 rounded-full bg-slate-300 text-white text-xs flex items-center justify-center font-medium">
                                                {getInitial(senderLabel)}
                                            </div>
                                        )}
                                    </div>
                                )}
                                <div
                                    className={`max-w-xs sm:max-w-sm px-3.5 py-2 rounded-2xl shadow-sm ${isMine
                                        ? 'bg-blue-600 text-white rounded-br-sm'
                                        : 'bg-white text-slate-800 rounded-bl-sm border border-slate-100'
                                        }`}
                                >
                                    {!isMine && !isGrouped && (
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
                {showScrollButton && (
                    <button
                        onClick={scrollToBottom}
                        className="fixed bottom-24 right-8 bg-blue-600 text-white rounded-full px-4 py-2 text-xs font-medium shadow-lg hover:bg-blue-700 transition-colors"
                    >
                        ↓ New messages
                    </button>
                )}
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