import { useEffect } from 'react'

function Toast({ message, onClose }) {
    useEffect(() => {
        const t = setTimeout(onClose, 4000)
        return () => clearTimeout(t)
    }, [onClose])

    return (
        <div className="fixed top-4 right-4 bg-red-500 text-white px-4 py-2.5 rounded-lg shadow-lg text-sm z-50 animate-in fade-in slide-in-from-top-2">
            {message}
        </div>
    )
}

export default Toast