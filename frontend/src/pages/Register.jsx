import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { registerUser } from '../api'

function Register() {
    const [username, setUsername] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const navigate = useNavigate()

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        try {
            await registerUser(username, email, password)
            navigate('/login')
        } catch (err) {
            const detail = err.response?.data?.detail
            setError(detail || 'Registration failed')
        }
    }

    return (
        <div className="flex items-center justify-center h-screen bg-gray-100">
            <form
                onSubmit={handleSubmit}
                className="bg-white p-8 rounded-lg shadow-md w-80 flex flex-col gap-4"
            >
                <h1 className="text-2xl font-bold text-center">Register</h1>

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
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
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
                    Register
                </button>

                <p className="text-sm text-center">
                    Already have an account? <Link to="/login" className="text-blue-600">Log In</Link>
                </p>
            </form>
        </div>
    )
}

export default Register