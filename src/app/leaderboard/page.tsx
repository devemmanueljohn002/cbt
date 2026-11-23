import { backendFetch } from '@/lib/backend'

export const dynamic = 'force-dynamic'

export default async function Leaderboard() {
  const response = await backendFetch('/api/v1/leaderboard')
  const data = response.ok ? await response.json() : { individual: [], classes: [] }
  return <main><h1>Championship leaderboard</h1><p className="mut">Rankings from published examination results only.</p>
    {!response.ok && <p className="err">Leaderboard data is temporarily unavailable.</p>}
    <h2>Individual rankings</h2>
    {data.individual.length === 0 ? <p className="mut">No published individual results are available yet.</p> : <table><thead><tr><th>Rank</th><th>Student</th><th>Class</th><th>Examination</th><th>Score</th><th>Time</th></tr></thead><tbody>
      {data.individual.map((row: any, index: number) => <tr key={row.id}><td>{index + 1}</td><td>{row.student.fullName}</td><td>{row.student.class.name}</td><td>{row.exam.title}</td><td><b>{row.score}/{row.total}</b></td><td>{Math.floor(row.timeSeconds / 60)}m {row.timeSeconds % 60}s</td></tr>)}
    </tbody></table>}
    <h2 style={{ marginTop: 28 }}>Inter-class rankings</h2>
    {data.classes.length === 0 ? <p className="mut">Class rankings will appear when results are published.</p> : <table><thead><tr><th>Rank</th><th>Class</th><th>Average score</th><th>Participants</th></tr></thead><tbody>
      {data.classes.map((row: any, index: number) => <tr key={row.classId}><td>{index + 1}</td><td>{row.className}</td><td><b>{row.avgPercent}%</b></td><td>{row.participants}</td></tr>)}
    </tbody></table>}
  </main>
}
