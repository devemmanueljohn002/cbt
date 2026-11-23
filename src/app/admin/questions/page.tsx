'use client'

import { DragEvent, useEffect, useRef, useState } from 'react'

type Subject = { id: string; name: string }
type SchoolClass = { id: string; name: string }

export default function Questions() {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [classes, setClasses] = useState<SchoolClass[]>([])
  const [rows, setRows] = useState<any[]>([])
  const [message, setMessage] = useState('')
  const [importOpen, setImportOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<any | null>(null)
  const [dragging, setDragging] = useState(false)
  const [loading, setLoading] = useState(false)
  const [targetClassId, setTargetClassId] = useState('')
  const [targetSubjectId, setTargetSubjectId] = useState('')
  const [statusOverride, setStatusOverride] = useState('')
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [result, setResult] = useState<any | null>(null)
  const fileInput = useRef<HTMLInputElement>(null)

  async function load() {
    const [questionResponse, classResponse, subjectResponse] = await Promise.all([
      fetch('/api/admin/questions'),
      fetch('/api/admin/classes'),
      fetch('/api/admin/subjects'),
    ])
    if (questionResponse.ok) setRows(await questionResponse.json())
    if (classResponse.ok) setClasses(await classResponse.json())
    if (subjectResponse.ok) setSubjects(await subjectResponse.json())
  }

  useEffect(() => { void load() }, [])

  async function add(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const labels = ['A', 'B', 'C', 'D']
    const correct = Number(form.get('correct'))
    const options = labels.map((label, index) => ({
      label,
      text: String(form.get(`option${index}`) || ''),
      isCorrect: index === correct,
    }))
    const response = await fetch('/api/admin/questions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: form.get('text'),
        subjectId: form.get('subjectId'),
        classId: form.get('classId'),
        topic: form.get('topic') || undefined,
        difficulty: form.get('difficulty'),
        marks: Number(form.get('marks')),
        explanation: form.get('explanation') || undefined,
        imageUrl: form.get('imageUrl') || undefined,
        options,
      }),
    })
    const result = await response.json()
    setMessage(response.ok ? 'Question approved and added' : `Error: ${result.error}`)
    if (response.ok) {
      event.currentTarget.reset()
      await load()
    }
  }

  function acceptFile(nextFile: File) {
    if (!nextFile.name.toLowerCase().endsWith('.csv')) {
      setMessage('Error: Please select a CSV file')
      return
    }
    if (nextFile.size > 5 * 1024 * 1024) {
      setMessage('Error: CSV file exceeds the 5 MB size limit')
      return
    }
    setFile(nextFile)
    setPreview(null)
    setResult(null)
    setMessage('')
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setDragging(false)
    if (event.dataTransfer.files[0]) acceptFile(event.dataTransfer.files[0])
  }

  async function validateCsv() {
    if (!file) return
    setLoading(true)
    const form = new FormData()
    form.append('file', file)
    form.append('mode', 'preview')
    if (targetClassId) form.append('targetClassId', targetClassId)
    if (targetSubjectId) form.append('targetSubjectId', targetSubjectId)
    if (statusOverride) form.append('statusOverride', statusOverride)
    const response = await fetch('/api/admin/questions/import-csv', { method: 'POST', body: form })
    const value = await response.json()
    if (!response.ok) {
      setMessage(`Error: ${value.error || 'Could not validate the CSV file'}`)
    } else {
      setPreview(value)
      setSelected(new Set(value.rows.filter((row: any) => row.valid && !row.duplicate).map((row: any) => row.row)))
      setMessage('')
    }
    setLoading(false)
  }

  async function importCsv() {
    if (!file || !preview) return
    if (!window.confirm(`Import ${selected.size} selected valid questions?`)) return
    setLoading(true)
    const form = new FormData()
    form.append('file', file)
    form.append('mode', 'import')
    form.append('selectedRows', [...selected].join(','))
    if (targetClassId) form.append('targetClassId', targetClassId)
    if (targetSubjectId) form.append('targetSubjectId', targetSubjectId)
    if (statusOverride) form.append('statusOverride', statusOverride)
    const response = await fetch('/api/admin/questions/import-csv', { method: 'POST', body: form })
    const value = await response.json()
    if (!response.ok) {
      setMessage(`Error: ${value.error || 'The import failed'}`)
    } else {
      setResult(value)
      setMessage('Question CSV import completed')
      await load()
    }
    setLoading(false)
  }

  function downloadText(filename: string, text: string) {
    const blob = new Blob([text], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = filename
    anchor.click()
    URL.revokeObjectURL(url)
  }

  function downloadTemplate() {
    downloadText('question-import-template.csv',
      'question_number,class,subject,question_type,question,option_a,option_b,option_c,option_d,correct_answer,difficulty,status,marks\r\n')
  }

  function downloadSample() {
    downloadText('question-import-sample.csv',
      'question_number,class,subject,question_type,question,option_a,option_b,option_c,option_d,correct_answer,difficulty,status,marks\r\n' +
      '1,JSS 1,Mathematics,MCQ,What is 5 + 5?,8,9,10,11,C,EASY,APPROVED,1\r\n')
  }

  function clearImport() {
    setFile(null)
    setPreview(null)
    setResult(null)
    setSelected(new Set())
  }

  return (
    <main>
      <div className="row" style={{ alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ margin: 0 }}>Question bank</h1>
        <button type="button" onClick={() => setImportOpen(true)}>Import Questions (CSV)</button>
      </div>
      <form onSubmit={add} className="card">
        <textarea name="text" placeholder="Question text" required style={{ width: '100%', minHeight: 100 }} />
        <div className="row">
          <select name="subjectId" required defaultValue=""><option value="" disabled>Subject</option>{subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}</select>
          <select name="classId" required defaultValue=""><option value="" disabled>Class</option>{classes.map((schoolClass) => <option key={schoolClass.id} value={schoolClass.id}>{schoolClass.name}</option>)}</select>
          <input name="topic" placeholder="Topic" />
          <select name="difficulty" defaultValue="MEDIUM"><option>EASY</option><option>MEDIUM</option><option>HARD</option><option>EXPERT</option></select>
          <input name="marks" type="number" min="1" max="20" defaultValue="1" />
        </div>
        {[0, 1, 2, 3].map((index) => (
          <div className="row" key={index}>
            <label style={{ width: '100%' }}>
              <input type="radio" name="correct" value={index} defaultChecked={index === 0} /> Option {String.fromCharCode(65 + index)}
              <input name={`option${index}`} required style={{ width: '70%', marginLeft: 10 }} />
            </label>
          </div>
        ))}
        <input name="imageUrl" placeholder="Optional diagram/image URL" style={{ width: '100%' }} />
        <textarea name="explanation" placeholder="Answer explanation" style={{ width: '100%', marginTop: 10 }} />
        <button>Add approved question</button>
      </form>
      {message && <p role="status">{message}</p>}
      <h2>Question library</h2>
      {rows.length === 0 ? <p className="mut">No questions yet.</p> : (
        <table>
          <thead><tr><th>Question</th><th>Subject</th><th>Difficulty</th><th>Marks</th></tr></thead>
          <tbody>{rows.map((row) => <tr key={row.id}><td>{row.text}</td><td>{row.subject.name}</td><td>{row.difficulty}</td><td>{row.marks}</td></tr>)}</tbody>
        </table>
      )}
      {importOpen && (
        <div role="dialog" aria-modal="true" style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(3,9,25,.82)', padding: 20, overflow: 'auto' }}>
          <div className="card" style={{ maxWidth: 1180, margin: '20px auto', maxHeight: 'calc(100vh - 40px)', overflow: 'auto' }}>
            <div className="row" style={{ alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 style={{ margin: 0 }}>Import Questions (CSV)</h2>
              <button type="button" className="sec" onClick={() => setImportOpen(false)}>Close</button>
            </div>

            {!preview && !result && (
              <>
                <div
                  onDragOver={(event) => { event.preventDefault(); setDragging(true) }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={onDrop}
                  onClick={() => fileInput.current?.click()}
                  style={{ border: `2px dashed ${dragging ? '#f4c24e' : '#29416f'}`, borderRadius: 16, padding: 42, textAlign: 'center', cursor: 'pointer', background: 'rgba(22,41,86,.55)' }}
                >
                  <input ref={fileInput} type="file" accept=".csv,text/csv" hidden onChange={(event) => event.target.files?.[0] && acceptFile(event.target.files[0])} />
                  <b>{file ? file.name : 'Drag and drop a CSV file here'}</b>
                  {file && <p className="mut">{(file.size / 1024).toFixed(1)} KB</p>}
                  <p className="mut">UTF-8 or UTF-8 BOM · Maximum 5 MB</p>
                  <button type="button" onClick={(event) => { event.stopPropagation(); fileInput.current?.click() }}>Browse Files</button>
                </div>
                {file && (
                  <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                    <div><b>Selected:</b> {file.name} <span className="mut">({(file.size / 1024).toFixed(1)} KB)</span></div>
                    <button type="button" className="sec" onClick={clearImport}>Clear selected file</button>
                  </div>
                )}
                <div className="row">
                  <button type="button" className="sec" onClick={downloadTemplate}>Download CSV Template</button>
                  <button type="button" className="sec" onClick={downloadSample}>Download Sample CSV</button>
                  <button type="button" disabled={!file || loading} onClick={validateCsv}>{loading ? 'Validating...' : 'Preview CSV'}</button>
                </div>
              </>
            )}

            {preview && !result && (
              <>
                <div className="kpis" style={{ marginBottom: 16 }}>
                  <div className="kpi"><b>{preview.total}</b><span>Total CSV rows</span></div>
                  <div className="kpi"><b>{preview.valid}</b><span>Valid questions</span></div>
                  <div className="kpi"><b>{preview.invalid}</b><span>Invalid questions</span></div>
                  <div className="kpi"><b>{preview.duplicates}</b><span>Duplicate questions</span></div>
                </div>

                <div className="row">
                  <label>Target class (optional)<select value={targetClassId} onChange={(event) => setTargetClassId(event.target.value)}><option value="">Use CSV class</option>{classes.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
                  <label>Target subject (optional)<select value={targetSubjectId} onChange={(event) => setTargetSubjectId(event.target.value)}><option value="">Use CSV subject</option>{subjects.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
                  <label>Save status<select value={statusOverride} onChange={(event) => setStatusOverride(event.target.value)}><option value="">Use CSV status</option><option value="DRAFT">DRAFT</option><option value="APPROVED">APPROVED</option></select></label>
                </div>

                <div className="row" style={{ alignItems: 'center' }}>
                  <button type="button" className="sec" onClick={() => setSelected(new Set(preview.rows.filter((row: any) => row.valid && !row.duplicate).map((row: any) => row.row)))}>Select all valid</button>
                  <button type="button" className="sec" onClick={() => setSelected(new Set())}>Clear selection</button>
                  <span className="mut">{selected.size} ready for import</span>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table>
                    <thead><tr><th>Select</th><th>Row</th><th>Class</th><th>Subject</th><th>Question</th><th>Options</th><th>Answer</th><th>Difficulty</th><th>Status</th><th>Marks</th><th>Validation</th></tr></thead>
                    <tbody>
                      {preview.rows.map((row: any) => (
                        <tr key={row.row}>
                          <td><input type="checkbox" checked={selected.has(row.row)} disabled={!row.valid || row.duplicate} onChange={(event) => setSelected((current) => { const next = new Set(current); event.target.checked ? next.add(row.row) : next.delete(row.row); return next })} /></td>
                          <td>{row.row}</td><td>{row.className}</td><td>{row.subjectName}</td><td>{row.question}</td>
                          <td>{row.options.map((option: any) => `${option.label}: ${option.text}`).join(' · ')}</td>
                          <td>{row.correctAnswer}</td><td>{row.difficulty}</td><td>{row.status}</td><td>{row.marks}</td>
                          <td>
                            {row.duplicate ? <span style={{ color: '#f4c24e' }}>Warning: Duplicate</span> :
                              row.valid ? <span style={{ color: '#67d7a3' }}>Valid</span> :
                                <span style={{ color: '#ff8d8d' }}>{row.reasons.join('; ')}</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="row" style={{ justifyContent: 'flex-end' }}>
                  <button type="button" className="sec" onClick={clearImport}>Cancel import</button>
                  <button type="button" disabled={loading || selected.size === 0} onClick={importCsv}>{loading ? 'Importing...' : 'Proceed with selected valid rows'}</button>
                </div>
              </>
            )}

            {result && (
              <>
                <h3>Import complete</h3>
                <div className="kpis">
                  <div className="kpi"><b>{result.successfullyImported}</b><span>Successfully imported</span></div>
                  <div className="kpi"><b>{result.skipped}</b><span>Skipped</span></div>
                  <div className="kpi"><b>{result.failed}</b><span>Failed</span></div>
                  <div className="kpi"><b>{result.duplicates}</b><span>Duplicates detected</span></div>
                </div>
                {result.errorReportCsv && (result.failed > 0 || result.duplicates > 0) && (
                  <div className="row"><button type="button" className="sec" onClick={() => downloadText('question-import-errors.csv', result.errorReportCsv)}>Download Error Report CSV</button></div>
                )}
                <div className="row" style={{ justifyContent: 'flex-end' }}>
                  <button type="button" onClick={() => { clearImport(); setImportOpen(false) }}>Done</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </main>
  )
}
