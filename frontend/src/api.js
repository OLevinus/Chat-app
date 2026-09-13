import axios from 'axios'

const API_BASE_URL = 'http://localhost:8000' // adjust if your backend runs elsewhere

const api = axios.create({
    baseURL: API_BASE_URL,
})

// Attach token to every request if we have one
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token')
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})

export const registerUser = (username, email, password) =>
    api.post('/register', { username, email, password })

export const loginUser = (username, password) => {
    // /login expects form-urlencoded data, not JSON
    const params = new URLSearchParams()
    params.append('username', username)
    params.append('password', password)
    return api.post('/login', params, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })
}

export const getCurrentUser = () => api.get('/me')
export const getMyRooms = () => api.get('/rooms/')
export const createRoom = (name) => api.post('/rooms/', { name, is_direct: 0 })
export const joinRoom = (roomId) => api.post(`/rooms/${roomId}/join`)
export const getRoomMessages = (roomId) => api.get(`/rooms/${roomId}/messages`)
export const getRoomMembers = (roomId) => api.get(`/rooms/${roomId}/members`)
export const leaveRoom = (roomId) => api.delete(`/rooms/${roomId}/leave`)
export const getDiscoverRooms = () => api.get('/rooms/discover')

export default api