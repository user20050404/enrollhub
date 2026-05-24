export default function StatCard({ label, value, sub, color = 'amber', icon }) {
  const colors = {
    amber:  'from-amber-500/10 border-amber-500/20 text-amber-400',
    indigo: 'from-indigo-500/10 border-indigo-500/20 text-indigo-400',
    teal:   'from-teal-500/10  border-teal-500/20  text-teal-400',
    rose:   'from-rose-500/10  border-rose-500/20  text-rose-400',
  }

  return (
    <div className={`bg-gradient-to-br ${colors[color]} border rounded-xl p-5 relative overflow-hidden`}>
      <div className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-2">{label}</div>
      <div className="text-3xl font-bold text-white">{value}</div>
      {sub && <div className="text-xs text-gray-500 mt-1">{sub}</div>}
      {icon && <div className="absolute right-4 top-4 text-2xl opacity-20">{icon}</div>}
    </div>
  )
}