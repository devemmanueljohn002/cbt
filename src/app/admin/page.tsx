import { guard } from '@/lib/auth'
import { backendFetch } from '@/lib/backend'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function Admin() {
  await guard('ADMIN')
  const response = await backendFetch('/api/v1/admin/overview')
  const stats = response.ok ? await response.json() : null
  return <main className="portal-main"><h1>Competition control centre</h1><p className="mut">Manage the championship and monitor its live status.</p>
    {!stats && <p className="err">The backend could not provide dashboard statistics. Check that FastAPI is running.</p>}
    <div className="kpis">
      <div className="kpi"><b>{stats?.students ?? '—'}</b><span>Registered students</span></div><div className="kpi"><b>{stats?.classes ?? '—'}</b><span>Classes</span></div>
      <div className="kpi"><b>{stats?.examinations ?? '—'}</b><span>Examinations</span></div><div className="kpi"><b>{stats?.questions ?? '—'}</b><span>Questions</span></div>
      <div className="kpi"><b>{stats?.activeExaminations ?? '—'}</b><span>Active examinations</span></div><div className="kpi"><b>{stats?.publishedResults ?? '—'}</b><span>Published results</span></div>
    </div>
    <section className="cards" style={{ marginTop: 20 }}>
      <Link className="card" href="/admin/students"><h3>Student management</h3><p>Register, import, edit and reset student accounts.</p></Link>
      <Link className="card" href="/admin/classes"><h3>Class management</h3><p>Create participating classes and review populations.</p></Link>
      <Link className="card" href="/admin/questions"><h3>Question bank</h3><p>Create and approve curriculum-aligned questions.</p></Link>
      <Link className="card" href="/admin/examinations"><h3>Examinations</h3><p>Schedule, control and publish competition examinations.</p></Link>
    </section>
  </main>
}
