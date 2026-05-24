import { useState } from 'react'
import api from '../../api/axios'

export default function ChatWidget() {
  const [open, setOpen]       = useState(false)
  const [input, setInput]     = useState('')
  const [loading, setLoading] = useState(false)
  const [messages, setMessages] = useState([
    { from: 'bot', text: 'Hi! I\'m EnrollBot. Ask me about enrollment status, section availability, or student records.' }
  ])

  const send = async () => {
    const text = input.trim()
    if (!text || loading) return
    setMessages(m => [...m, { from: 'user', text }])
    setInput('')
    setLoading(true)
    try {
      const res = await api.post('/chatbot/message/', { message: text })
      setMessages(m => [...m, { from: 'bot', text: res.data.reply }])
    } catch {
      setMessages(m => [...m, { from: 'bot', text: 'Sorry, something went wrong. Please try again.' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {/* Chat window */}
      {open && (
        <div className="mb-3 w-72 bg-gray-900 border border-gray-700 rounded-2xl overflow-hidden shadow-2xl">
          {/* Header */}
          <div className="bg-indigo-600 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-sm">🤖</div>
              <div>
                <div className="text-white text-sm font-semibold">EnrollBot</div>
                <div className="text-indigo-200 text-xs">Always online</div>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="text-white/60 hover:text-white text-lg leading-none">×</button>
          </div>

          {/* Messages */}
          <div className="p-3 space-y-2 max-h-64 overflow-y-auto">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] text-xs px-3 py-2 rounded-xl leading-relaxed ${
                  msg.from === 'user'
                    ? 'bg-indigo-600 text-white rounded-br-sm'
                    : 'bg-gray-800 text-gray-200 rounded-bl-sm'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-800 text-gray-400 text-xs px-3 py-2 rounded-xl rounded-bl-sm">Thinking...</div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-3 border-t border-gray-800 flex gap-2">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && send()}
              placeholder="Ask anything…"
              className="flex-1 bg-gray-800 border border-gray-700 text-white text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500"
            />
            <button
              onClick={send} disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs px-3 py-2 rounded-lg transition-colors"
            >
              ↑
            </button>
          </div>
        </div>
      )}

      {/* Toggle button */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-12 h-12 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white text-xl shadow-lg shadow-indigo-600/30 flex items-center justify-center transition-all hover:scale-110"
      >
        {open ? '×' : '💬'}
      </button>
    </div>
  )
}