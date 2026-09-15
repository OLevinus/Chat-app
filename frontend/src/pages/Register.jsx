import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { registerUser } from '../api'

function Register() {
    const [username, setUsername] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate()

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)
        try {
            await registerUser(username, email, password)
            navigate('/login')
        } catch (err) {
            const detail = err.response?.data?.detail
            setError(detail || 'Registration failed')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 px-4">
            <form
                onSubmit={handleSubmit}
                className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm w-full max-w-sm flex flex-col gap-4"
            >
                <div className="text-center mb-1">
                    <h1 className="text-2xl font-semibold text-slate-800">Create an account</h1>
                    <p className="text-sm text-slate-400 mt-1">Join the conversation</p>
                </div>

                {error && (
                    <p className="text-red-500 text-sm text-center bg-red-50 rounded-lg px-3 py-2">
                        {error}
                    </p>
                )}

                <input
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="border border-slate-200 bg-slate-50 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                    required
                />
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="border border-slate-200 bg-slate-50 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                    required
                />
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="border border-slate-200 bg-slate-50 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                    required
                />
                <button
                    type="submit"
                    disabled={loading}
                    className="bg-blue-600 text-white rounded-xl py-2.5 font-medium hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
                >
                    {loading ? 'Creating account…' : 'Register'}
                </button>

                <p className="text-sm text-center text-slate-500">
                    Already have an account?{' '}
                    <Link to="/login" className="text-blue-600 font-medium hover:underline">
                        Log In
                    </Link>
                </p>
            </form>
        </div>
    )
}

export default Register