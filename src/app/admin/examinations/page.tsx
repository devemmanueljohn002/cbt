'use client'

import { useEffect, useState } from 'react'

export default function Examinations() {
  const [classes, setClasses] = useState<any[]>([])
  const [subjects, setSubjects] = useState<any[]>([])
  const [rows, setRows] = useState<any[]>([])
  const [message, setMessage] = useState('')

  async function load() {
    const [classResponse, examResponse] = await Promise.all([
      fetch('/api/admin/classes'),
      fetch('/api/admin/examinations'),
    ])
    const subjectResponse = await fetch('/api/admin/subjects')
    if (classResponse.ok) setClasses(await classResponse.json())
    if (examResponse.ok) setRows(await examResponse.json())
    if (subjectResponse.ok) setSubjects(await subjectResponse.json())
  }

  useEffect(() => { void load() }, [])

  async function add(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const response = await fetch('/api/admin/examinations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: form.get('title'),
        classId: form.get('classId'),
        subjectId: form.get('subjectId') || undefined,
        durationMin: Number(form.get('durationMin')),
        startsAt: form.get('startsAt'),
        endsAt: form.get('endsAt'),
        questionCount: Number(form.get('questionCount')),
        negativeMarking: form.get('negativeMarking') === 'on',
        shuffleQuestions: form.get('shuffleQuestions') === 'on',
        shuffleOptions: form.get('shuffleOptions') === 'on',
      }),
    })
    const result = await response.json()
    setMessage(response.ok ? 'Examination scheduled' : `Error: ${result.error}`)
    if (response.ok) {
      event.currentTarget.reset()
      await load()
    }
  }

  async function action(id: string, action: 'GO_LIVE' | 'PAUSE' | 'RESUME' | 'CLOSE' | 'PUBLISH_RESULTS' | 'CANCEL' | 'EXTEND', minutes?: number) {
    if (action === 'CANCEL' && !confirm('Cancel this examination?')) return
    const response = await fetch(`/api/admin/examinations/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ...(minutes ? { minutes } : {}) }),
    })
    const result = await response.json()
    setMessage(response.ok ? 'Examination updated' : `Error: ${result.error}`)
    if (response.ok) await load()
  }

  return (
    <main>
      <h1>Examination management</h1>
      <form onSubmit={add} className="card">
        <div className="row">
          <input name="title" placeholder="Examination title" required />
          <select name="classId" required defaultValue=""><option value="" disabled>Class</option>{classes.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
          <select name="subjectId" defaultValue=""><option value="">All subjects</option>{subjects.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
          <input name="durationMin" type="number" min="1" max="300" defaultValue="40" />
          <input name="questionCount" type="number" min="1" max="200" defaultValue="40" />
        </div>
        <div className="row">
          <label>Starts<input name="startsAt" type="datetime-local" required /></label>
          <label>Ends<input name="endsAt" type="datetime-local" required /></label>
        </div>
        <div className="row">
          <label><input name="shuffleQuestions" type="checkbox" defaultChecked /> Shuffle questions</label>
          <label><input name="shuffleOptions" type="checkbox" defaultChecked /> Shuffle options</label>
          <label><input name="negativeMarking" type="checkbox" /> Negative marking</label>
        </div>
        <button>Schedule examination</button>
      </form>
      {message && <p role="status">{message}</p>}
      <h2>Scheduled examinations</h2>
      {rows.length === 0 ? <p className="mut">No examinations scheduled.</p> : (
        <table>
          <thead><tr><th>Title</th><th>Class</th><th>Status</th><th>Questions</th><th>Schedule</th><th>Actions</th></tr></thead>
          <tbody>{rows.map((row) => (
            <tr key={row.id}>
              <td>{row.title}</td><td>{row.class.name}</td><td>{row.status}</td><td>{row._count.questions}</td>
              <td>{new Date(row.startsAt).toLocaleString()}</td>
              <td>
                {row.status === 'SCHEDULED' && <button className="sec" onClick={() => action(row.id, 'GO_LIVE')}>Go live</button>}
                {row.status === 'LIVE' && <button className="sec" onClick={() => action(row.id, 'PAUSE')}>Pause</button>}
                {row.status === 'PAUSED' && <button className="sec" onClick={() => action(row.id, 'RESUME')}>Resume</button>}
                {row.status === 'LIVE' && <button className="sec" onClick={() => {
                  const value = window.prompt('Add how many minutes?', '10')
                  if (value && Number(value) > 0) void action(row.id, 'EXTEND', Number(value))
                }} style={{ marginLeft: 6 }}>Extend time</button>}
                {(row.status === 'LIVE' || row.status === 'SCHEDULED') && <button className="sec" onClick={() => action(row.id, 'CLOSE')} style={{ marginLeft: 6 }}>Close</button>}
                {row.status === 'CLOSED' && !row.resultsPublished && <button onClick={() => action(row.id, 'PUBLISH_RESULTS')} style={{ marginLeft: 6 }}>Publish results</button>}
                {row.status !== 'CANCELLED' && row.status !== 'CLOSED' && <button className="sec" onClick={() => action(row.id, 'CANCEL')} style={{ marginLeft: 6 }}>Cancel</button>}
              </td>
            </tr>
          ))}</tbody>
        </table>
      )}
    </main>
  )
}
