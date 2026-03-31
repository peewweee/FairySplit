import { useEffect, useState } from 'react'
import './App.css'

const MS_IN_SECOND = 1000
const MS_IN_MINUTE = 60 * MS_IN_SECOND
const MS_IN_HOUR = 60 * MS_IN_MINUTE
const MS_IN_DAY = 24 * MS_IN_HOUR

const currencyFormatter = new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP',
})

const dateTimeFormatter = new Intl.DateTimeFormat('en-PH', {
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
})

const initialSessions = [
  {
    id: 'stay-1',
    start: '2026-03-25T18:00:00',
    end: '2026-03-27T08:00:00',
    source: 'manual',
  },
  {
    id: 'stay-2',
    start: '2026-03-28T19:30:00',
    end: '2026-03-29T14:15:00',
    source: 'manual',
  },
]

const otherResidents = [
  { name: 'Bianca', days: 15 },
  { name: 'Carlo', days: 10 },
  { name: 'Mika', days: 8 },
]

function formatDateTimeInput(date) {
  const localDate = new Date(date)
  const offset = localDate.getTimezoneOffset() * MS_IN_MINUTE
  const normalized = new Date(localDate.getTime() - offset)

  return normalized.toISOString().slice(0, 16)
}

function formatDuration(ms, includeSeconds = false) {
  const safeMs = Math.max(0, ms)
  const totalSeconds = Math.floor(safeMs / MS_IN_SECOND)
  const days = Math.floor(totalSeconds / (MS_IN_DAY / MS_IN_SECOND))
  const hours = Math.floor(
    (totalSeconds % (MS_IN_DAY / MS_IN_SECOND)) / (MS_IN_HOUR / MS_IN_SECOND),
  )
  const minutes = Math.floor(
    (totalSeconds % (MS_IN_HOUR / MS_IN_SECOND)) /
      (MS_IN_MINUTE / MS_IN_SECOND),
  )
  const seconds = totalSeconds % (MS_IN_MINUTE / MS_IN_SECOND)

  if (includeSeconds) {
    return `${days}d ${hours}h ${minutes}m ${seconds}s`
  }

  return `${days}d ${hours}h ${minutes}m`
}

function formatStayDays(durationMs) {
  return (durationMs / MS_IN_DAY).toFixed(2)
}

function formatDateTimeLabel(value) {
  return dateTimeFormatter.format(new Date(value))
}

function createSessionId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }

  return `stay-${Date.now()}`
}

function App() {
  const [step, setStep] = useState('identity')
  const [draftName, setDraftName] = useState('')
  const [userName, setUserName] = useState('')
  const [roomAction, setRoomAction] = useState('create')
  const [roomName, setRoomName] = useState('Moonlight Dorm')
  const [roomCode, setRoomCode] = useState('FAIRY-204')
  const [billName, setBillName] = useState('Electricity + Water')
  const [billAmount, setBillAmount] = useState('6000')
  const [alwaysOnAmount, setAlwaysOnAmount] = useState('1200')
  const [billStart, setBillStart] = useState('2026-03-01')
  const [billEnd, setBillEnd] = useState('2026-03-31')
  const [sessions, setSessions] = useState(initialSessions)
  const [activeSessionStart, setActiveSessionStart] = useState(null)
  const [now, setNow] = useState(() => Date.now())
  const [manualStart, setManualStart] = useState(() =>
    formatDateTimeInput(new Date(Date.now() - 5 * MS_IN_HOUR)),
  )
  const [manualEnd, setManualEnd] = useState(() =>
    formatDateTimeInput(new Date(Date.now() - 2 * MS_IN_HOUR)),
  )
  const [manualError, setManualError] = useState('')

  useEffect(() => {
    if (!activeSessionStart) {
      return undefined
    }

    const intervalId = window.setInterval(() => {
      setNow(Date.now())
    }, MS_IN_SECOND)

    return () => window.clearInterval(intervalId)
  }, [activeSessionStart])

  const displayName = userName || 'You'
  const currentRoomName = roomName.trim() || 'Moonlight Dorm'
  const parsedBillAmount = Number(billAmount) || 0
  const parsedAlwaysOnAmount = Math.min(
    Number(alwaysOnAmount) || 0,
    parsedBillAmount,
  )
  const sharedByUsageAmount = Math.max(
    parsedBillAmount - parsedAlwaysOnAmount,
    0,
  )

  const completedDurationMs = sessions.reduce((total, session) => {
    const startTime = new Date(session.start).getTime()
    const endTime = new Date(session.end).getTime()

    return total + Math.max(0, endTime - startTime)
  }, 0)

  const activeDurationMs = activeSessionStart
    ? Math.max(0, now - new Date(activeSessionStart).getTime())
    : 0

  const totalDurationMs = completedDurationMs + activeDurationMs
  const yourDays = totalDurationMs / MS_IN_DAY
  const participants = [{ name: displayName, days: yourDays }, ...otherResidents]
  const totalDaysStayed = participants.reduce(
    (total, participant) => total + participant.days,
    0,
  )
  const alwaysOnShare = participants.length
    ? parsedAlwaysOnAmount / participants.length
    : 0

  const amountRows = participants.map((participant) => {
    const usageShare = totalDaysStayed
      ? (participant.days / totalDaysStayed) * sharedByUsageAmount
      : 0
    const totalShare = usageShare + alwaysOnShare

    return {
      ...participant,
      usageShare,
      alwaysOnShare,
      totalShare,
    }
  })

  const yourRow =
    amountRows.find((participant) => participant.name === displayName) ??
    amountRows[0]

  function handleNameSubmit(event) {
    event.preventDefault()

    const trimmedName = draftName.trim()

    if (!trimmedName) {
      return
    }

    setUserName(trimmedName)
    setStep('room')
  }

  function handleRoomSubmit(event) {
    event.preventDefault()

    if (roomAction === 'create' && !roomName.trim()) {
      return
    }

    if (roomAction === 'join' && !roomCode.trim()) {
      return
    }

    setStep('dashboard')
  }

  function handleEnterDorm() {
    if (activeSessionStart) {
      return
    }

    setActiveSessionStart(new Date().toISOString())
    setNow(Date.now())
  }

  function handleExitDorm() {
    if (!activeSessionStart) {
      return
    }

    const finishedSession = {
      id: createSessionId(),
      start: activeSessionStart,
      end: new Date().toISOString(),
      source: 'timer',
    }

    setSessions((currentSessions) => [finishedSession, ...currentSessions])
    setActiveSessionStart(null)
  }

  function handleManualSessionSubmit(event) {
    event.preventDefault()

    const startTime = new Date(manualStart)
    const endTime = new Date(manualEnd)

    if (Number.isNaN(startTime.getTime()) || Number.isNaN(endTime.getTime())) {
      setManualError('Choose both a start and end date first.')
      return
    }

    if (endTime <= startTime) {
      setManualError('End time must be later than start time.')
      return
    }

    setSessions((currentSessions) => [
      {
        id: createSessionId(),
        start: startTime.toISOString(),
        end: endTime.toISOString(),
        source: 'manual',
      },
      ...currentSessions,
    ])
    setManualError('')
    setManualStart(formatDateTimeInput(startTime))
    setManualEnd(formatDateTimeInput(new Date(endTime.getTime() + MS_IN_HOUR)))
  }

  return (
    <main className="app-shell">
      <section className="hero-panel">
        <div className="hero-copy">
          <p className="eyebrow">Phase 1 frontend prototype</p>
          <h1>FairySplit</h1>
          <p className="hero-text">
            A shared expense app for dorms or houses where bills are split by
            how long each person actually stayed inside.
          </p>
        </div>
        <div className="step-strip" aria-label="Project flow">
          <span className={step === 'identity' ? 'step-chip active' : 'step-chip'}>
            1. Name
          </span>
          <span className={step === 'room' ? 'step-chip active' : 'step-chip'}>
            2. Room
          </span>
          <span className={step === 'dashboard' ? 'step-chip active' : 'step-chip'}>
            3. Dashboard
          </span>
        </div>
      </section>

      {step === 'identity' && (
        <section className="screen-card">
          <div className="screen-heading">
            <p className="section-label">First screen</p>
            <h2>Who is using FairySplit?</h2>
            <p>
              For now we only ask for a display name. Later, if we add real
              accounts, this can become a login or sign-up page.
            </p>
          </div>

          <form className="stack" onSubmit={handleNameSubmit}>
            <label className="field">
              <span>Your name</span>
              <input
                type="text"
                placeholder="Example: Phoebe"
                value={draftName}
                onChange={(event) => setDraftName(event.target.value)}
              />
            </label>

            <button className="primary-button" type="submit">
              Continue to room setup
            </button>
          </form>
        </section>
      )}

      {step === 'room' && (
        <section className="screen-card">
          <div className="screen-heading">
            <p className="section-label">Second screen</p>
            <h2>Create a room or join one</h2>
            <p>
              This mirrors your intended user flow. A user either creates a
              shared space or joins an existing one through a room code.
            </p>
          </div>

          <form className="stack" onSubmit={handleRoomSubmit}>
            <div className="toggle-row">
              <button
                className={
                  roomAction === 'create'
                    ? 'toggle-button active'
                    : 'toggle-button'
                }
                type="button"
                onClick={() => setRoomAction('create')}
              >
                Create room
              </button>
              <button
                className={
                  roomAction === 'join' ? 'toggle-button active' : 'toggle-button'
                }
                type="button"
                onClick={() => setRoomAction('join')}
              >
                Join room
              </button>
            </div>

            {roomAction === 'create' ? (
              <>
                <label className="field">
                  <span>Room name</span>
                  <input
                    type="text"
                    value={roomName}
                    onChange={(event) => setRoomName(event.target.value)}
                  />
                </label>

                <label className="field">
                  <span>Invite code</span>
                  <input
                    type="text"
                    value={roomCode}
                    onChange={(event) => setRoomCode(event.target.value.toUpperCase())}
                  />
                </label>
              </>
            ) : (
              <label className="field">
                <span>Room code</span>
                <input
                  type="text"
                  value={roomCode}
                  onChange={(event) => setRoomCode(event.target.value.toUpperCase())}
                />
              </label>
            )}

            <div className="inline-actions">
              <button
                className="secondary-button"
                type="button"
                onClick={() => setStep('identity')}
              >
                Back
              </button>
              <button className="primary-button" type="submit">
                Open room dashboard
              </button>
            </div>
          </form>
        </section>
      )}

      {step === 'dashboard' && (
        <section className="dashboard">
          <div className="room-banner">
            <div>
              <p className="section-label">Room overview</p>
              <h2>{currentRoomName}</h2>
              <p>
                Code: <strong>{roomCode || 'Not set yet'}</strong>
              </p>
            </div>
            <div className="pill-group">
              <span className="status-pill">
                {activeSessionStart ? 'Inside dorm' : 'Outside dorm'}
              </span>
              <button
                className="secondary-button"
                type="button"
                onClick={() => setStep('room')}
              >
                Edit room
              </button>
            </div>
          </div>

          <div className="dashboard-grid">
            <article className="panel">
              <div className="panel-header">
                <p className="section-label">Bill settings</p>
                <h3>{billName}</h3>
              </div>

              <div className="two-column-form">
                <label className="field">
                  <span>Bill name</span>
                  <input
                    type="text"
                    value={billName}
                    onChange={(event) => setBillName(event.target.value)}
                  />
                </label>

                <label className="field">
                  <span>Total bill amount</span>
                  <input
                    type="number"
                    min="0"
                    value={billAmount}
                    onChange={(event) => setBillAmount(event.target.value)}
                  />
                </label>

                <label className="field">
                  <span>Billing start date</span>
                  <input
                    type="date"
                    value={billStart}
                    onChange={(event) => setBillStart(event.target.value)}
                  />
                </label>

                <label className="field">
                  <span>Billing end date</span>
                  <input
                    type="date"
                    value={billEnd}
                    onChange={(event) => setBillEnd(event.target.value)}
                  />
                </label>

                <label className="field full-width">
                  <span>Always-on shared cost</span>
                  <input
                    type="number"
                    min="0"
                    value={alwaysOnAmount}
                    onChange={(event) => setAlwaysOnAmount(event.target.value)}
                  />
                </label>
              </div>

              <p className="hint-text">
                Example: refrigerator cost can be shared equally, while the rest
                of the bill is split by days stayed.
              </p>
            </article>

            <article className="panel accent-panel">
              <div className="panel-header">
                <p className="section-label">Time in and out</p>
                <h3>Stay tracker</h3>
              </div>

              <p className="big-number">
                {activeSessionStart
                  ? formatDuration(activeDurationMs, true)
                  : 'Timer ready'}
              </p>
              <p className="hint-text">
                {activeSessionStart
                  ? `${displayName} is currently inside the dorm.`
                  : 'Press enter when you arrive, and exit when you leave.'}
              </p>

              <div className="inline-actions">
                <button
                  className="primary-button"
                  type="button"
                  onClick={handleEnterDorm}
                  disabled={Boolean(activeSessionStart)}
                >
                  Time in
                </button>
                <button
                  className="secondary-button"
                  type="button"
                  onClick={handleExitDorm}
                  disabled={!activeSessionStart}
                >
                  Time out
                </button>
              </div>
            </article>

            <article className="panel">
              <div className="panel-header">
                <p className="section-label">Your total stay</p>
                <h3>Usage summary</h3>
              </div>

              <div className="summary-grid">
                <div className="summary-box">
                  <span className="summary-label">Total time inside</span>
                  <strong>{formatDuration(totalDurationMs)}</strong>
                </div>
                <div className="summary-box">
                  <span className="summary-label">Total days stayed</span>
                  <strong>{formatStayDays(totalDurationMs)} days</strong>
                </div>
              </div>

              <p className="hint-text">
                FairySplit converts tracked time into stay-days, then uses that
                value for fair billing.
              </p>
            </article>

            <article className="panel">
              <div className="panel-header">
                <p className="section-label">Forgot to time in/out?</p>
                <h3>Add a manual stay record</h3>
              </div>

              <form className="stack" onSubmit={handleManualSessionSubmit}>
                <label className="field">
                  <span>Start</span>
                  <input
                    type="datetime-local"
                    value={manualStart}
                    onChange={(event) => setManualStart(event.target.value)}
                  />
                </label>

                <label className="field">
                  <span>End</span>
                  <input
                    type="datetime-local"
                    value={manualEnd}
                    onChange={(event) => setManualEnd(event.target.value)}
                  />
                </label>

                {manualError ? <p className="error-text">{manualError}</p> : null}

                <button className="primary-button" type="submit">
                  Save manual record
                </button>
              </form>
            </article>

            <article className="panel wide-panel">
              <div className="panel-header">
                <p className="section-label">Transparency</p>
                <h3>Current bill breakdown</h3>
              </div>

              <div className="calculation-card">
                <p>
                  Billing period: <strong>{billStart}</strong> to{' '}
                  <strong>{billEnd}</strong>
                </p>
                <p>
                  Stay-based amount:{' '}
                  <strong>{currencyFormatter.format(sharedByUsageAmount)}</strong>
                </p>
                <p>
                  Equal-share exclusion:{' '}
                  <strong>{currencyFormatter.format(parsedAlwaysOnAmount)}</strong>
                </p>
                <p>
                  Total stay-days in room:{' '}
                  <strong>{totalDaysStayed.toFixed(2)}</strong>
                </p>
              </div>

              <div className="amount-list">
                {amountRows.map((participant) => (
                  <div
                    className={
                      participant.name === displayName
                        ? 'amount-row highlight'
                        : 'amount-row'
                    }
                    key={participant.name}
                  >
                    <div>
                      <strong>{participant.name}</strong>
                      <p>{participant.days.toFixed(2)} days stayed</p>
                    </div>
                    <div className="amount-values">
                      <span>
                        Usage: {currencyFormatter.format(participant.usageShare)}
                      </span>
                      <span>
                        Shared item:{' '}
                        {currencyFormatter.format(participant.alwaysOnShare)}
                      </span>
                      <strong>
                        Total: {currencyFormatter.format(participant.totalShare)}
                      </strong>
                    </div>
                  </div>
                ))}
              </div>

              <div className="your-amount-card">
                <p className="section-label">Your current estimate</p>
                <h3>{currencyFormatter.format(yourRow.totalShare)}</h3>
                <p>
                  Formula: ({formatStayDays(totalDurationMs)} /{' '}
                  {totalDaysStayed.toFixed(2)}) x{' '}
                  {currencyFormatter.format(sharedByUsageAmount)} +{' '}
                  {currencyFormatter.format(alwaysOnShare)}
                </p>
              </div>
            </article>

            <article className="panel wide-panel">
              <div className="panel-header">
                <p className="section-label">Stay history</p>
                <h3>Recent records</h3>
              </div>

              <div className="history-list">
                {activeSessionStart ? (
                  <div className="history-row active-history">
                    <div>
                      <strong>Active stay</strong>
                      <p>Started {formatDateTimeLabel(activeSessionStart)}</p>
                    </div>
                    <strong>{formatDuration(activeDurationMs, true)}</strong>
                  </div>
                ) : null}

                {sessions.map((session) => (
                  <div className="history-row" key={session.id}>
                    <div>
                      <strong>
                        {session.source === 'manual'
                          ? 'Manual correction'
                          : 'Timer session'}
                      </strong>
                      <p>
                        {formatDateTimeLabel(session.start)} to{' '}
                        {formatDateTimeLabel(session.end)}
                      </p>
                    </div>
                    <strong>
                      {formatDuration(
                        new Date(session.end).getTime() -
                          new Date(session.start).getTime(),
                      )}
                    </strong>
                  </div>
                ))}
              </div>
            </article>
          </div>
        </section>
      )}
    </main>
  )
}

export default App
