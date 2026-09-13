import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { loginUser, getCurrentUser } from '../api'

function Login() {
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const navigate = useNavigate()

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        try {
            const res = await loginUser(username, password)
            localStorage.setItem('token', res.data.access_token)

            // fetch user info so we know who's logged in
            const me = await getCurrentUser()
            localStorage.setItem('user', JSON.stringify(me.data))

            navigate('/rooms')
        } catch (err) {
            setError('Invalid username or password')
        }
    }

    return (
        <div className="flex items-center justify-center h-screen bg-gray-100">
            <form
                onSubmit={handleSubmit}
                className="bg-white p-8 rounded-lg shadow-md w-80 flex flex-col gap-4"
            >
                <h1 className="text-2xl font-bold text-center">Log In</h1>

                {error && <p className="text-red-500 text-sm text-center">{error}</p>}

                <input
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="border rounded px-3 py-2"
                    required
                />
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="border rounded px-3 py-2"
                    required
                />
                <button
                    type="submit"
                    className="bg-blue-600 text-white rounded py-2 font-semibold hover:bg-blue-700"
                >
                    Log In
                </button>

                <p className="text-sm text-center">
                    Don't have an account? <Link to="/register" className="text-blue-600">Register</Link>
                </p>
            </form>
        </div>
    )
}

export default Login