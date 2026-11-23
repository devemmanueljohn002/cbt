import { guard } from '@/lib/auth'
import { backendFetch } from '@/lib/backend'

export const dynamic = 'force-dynamic'

export default async function Page() {
  await guard('TEACHER')
  const response = await backendFetch('/api/v1/teacher/dashboard')
  if (!response.ok) return <main><h1>Teacher dashboard</h1><p className="err">Unable to load your teacher information.</p></main>
  const data = await response.json()
  if (!data.teacher) return <main><h1>Teacher dashboard</h1><p className="mut">No teacher profile is linked to this account.</p></main>
  return <main><h1>Welcome, {data.teacher.fullName}</h1><p className="mut">Restricted view for your assigned classes.</p>
    <div className="cards">{data.classes.map((item: { id: string; name: string; studentCount: number }) => <article className="card" key={item.id}><h3>{item.name}</h3><p>{item.studentCount} registered students</p></article>)}</div>
  </main>
}
