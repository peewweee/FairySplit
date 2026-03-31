import { useEffect, useState } from 'react'
import './App.css'

const MS_IN_SECOND = 1000
const MS_IN_MINUTE = 60 * MS_IN_SECOND
const MS_IN_HOUR = 60 * MS_IN_MINUTE
const MS_IN_DAY = 24 * MS_IN_HOUR

const weekdayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

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

const shortDateFormatter = new Intl.DateTimeFormat('en-PH', {
  month: 'short',
  day: 'numeric',
})

const calendarTitleFormatter = new Intl.DateTimeFormat('en-PH', {
  month: 'long',
  year: 'numeric',
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

const roomOptions = [
  { name: 'Moonlight Dorm', code: 'FAIRY-204' },
  { name: 'Clover Loft', code: 'PETAL-118' },
  { name: 'Starlight Unit', code: 'GLOW-302' },
]

function padNumber(value) {
  return String(value).padStart(2, '0')
}

function toDateKey(date) {
  return `${date.getFullYear()}-${padNumber(date.getMonth() + 1)}-${padNumber(
    date.getDate(),
  )}`
}

function getDateFromKey(dateKey) {
  return new Date(`${dateKey}T00:00:00`)
}

function addDays(date, amount) {
  const nextDate = new Date(date)
  nextDate.setDate(nextDate.getDate() + amount)
  return nextDate
}

function startOfWeek(date) {
  const weekStart = new Date(date)
  weekStart.setHours(0, 0, 0, 0)
  weekStart.setDate(weekStart.getDate() - weekStart.getDay())
  return weekStart
}

function endOfWeek(date) {
  return addDays(startOfWeek(date), 6)
}

function sortSessionsByStart(entries) {
  return [...entries].sort(
    (left, right) =>
      new Date(right.start).getTime() - new Date(left.start).getTime(),
  )
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

function formatDateTimeLabel(value) {
  return dateTimeFormatter.format(new Date(value))
}

function formatDateLabel(dateKey) {
  return shortDateFormatter.format(getDateFromKey(dateKey))
}

function createSessionId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }

  return `stay-${Date.now()}`
}

function buildRecordedDateKeys(entries) {
  const recordedDateKeys = new Set()

  entries.forEach((entry) => {
    let cursor = getDateFromKey(toDateKey(new Date(entry.start)))
    const endTime = Math.max(
      new Date(entry.start).getTime(),
      new Date(entry.end).getTime() - 1,
    )
    const lastDay = getDateFromKey(toDateKey(new Date(endTime)))

    while (cursor <= lastDay) {
      recordedDateKeys.add(toDateKey(cursor))
      cursor = addDays(cursor, 1)
    }
  })

  return recordedDateKeys
}

function buildCalendarDays(
  rangeStartKey,
  rangeEndKey,
  recordedDateKeys,
  selectedDateKeys,
  todayKey,
) {
  const calendarDays = []
  let cursor = startOfWeek(getDateFromKey(rangeStartKey))
  const lastDay = endOfWeek(getDateFromKey(rangeEndKey))
  const selectedDateKeySet = new Set(selectedDateKeys)

  while (cursor <= lastDay) {
    const dateKey = toDateKey(cursor)

    calendarDays.push({
      dateKey,
      dayNumber: cursor.getDate(),
      hasRecorded: recordedDateKeys.has(dateKey),
      isInRange: dateKey >= rangeStartKey && dateKey <= rangeEndKey,
      isSelected: selectedDateKeySet.has(dateKey),
      isToday: dateKey === todayKey,
    })

    cursor = addDays(cursor, 1)
  }

  return calendarDays
}

function subtractSelectedDatesFromSession(session, selectedRemovalDateKeys) {
  if (selectedRemovalDateKeys.size === 0) {
    return [session]
  }

  const sortedDateKeys = [...selectedRemovalDateKeys].sort()
  let remainingSegments = [
    {
      start: new Date(session.start),
      end: new Date(session.end),
    },
  ]

  sortedDateKeys.forEach((dateKey) => {
    const removalStart = getDateFromKey(dateKey)
    const removalEnd = addDays(removalStart, 1)
    const nextSegments = []

    remainingSegments.forEach((segment) => {
      if (removalEnd <= segment.start || removalStart >= segment.end) {
        nextSegments.push(segment)
        return
      }

      if (removalStart > segment.start) {
        nextSegments.push({
          start: new Date(segment.start),
          end: new Date(removalStart),
        })
      }

      if (removalEnd < segment.end) {
        nextSegments.push({
          start: new Date(removalEnd),
          end: new Date(segment.end),
        })
      }
    })

    remainingSegments = nextSegments
  })

  return remainingSegments
    .filter((segment) => segment.end > segment.start)
    .map((segment, index) => ({
      ...session,
      id:
        remainingSegments.length === 1 && index === 0
          ? session.id
          : createSessionId(),
      start: segment.start.toISOString(),
      end: segment.end.toISOString(),
    }))
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
  const [sessions, setSessions] = useState(() => sortSessionsByStart(initialSessions))
  const [activeSessionStart, setActiveSessionStart] = useState(null)
  const [now, setNow] = useState(() => Date.now())
  const [showRoomMenu, setShowRoomMenu] = useState(false)
  const [showCorrectionCalendar, setShowCorrectionCalendar] = useState(false)
  const [selectedCorrectionDates, setSelectedCorrectionDates] = useState([])
  const [selectedRemovalDates, setSelectedRemovalDates] = useState([])
  const [correctionStartTime, setCorrectionStartTime] = useState('')
  const [correctionEndTime, setCorrectionEndTime] = useState('')
  const [correctionHours, setCorrectionHours] = useState('')
  const [correctionError, setCorrectionError] = useState('')
  const [showBillSettings, setShowBillSettings] = useState(false)

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
  const todayKey = toDateKey(new Date(now))
  const rawBillStartKey = billStart || todayKey
  const rawBillEndKey = billEnd || todayKey
  const rangeStartKey =
    rawBillStartKey <= rawBillEndKey ? rawBillStartKey : rawBillEndKey
  const rangeEndKey =
    rawBillStartKey <= rawBillEndKey ? rawBillEndKey : rawBillStartKey
  const billPeriodLabel = `${formatDateLabel(rangeStartKey)} - ${formatDateLabel(
    rangeEndKey,
  )}`
  const calendarTitle =
    rangeStartKey.slice(0, 7) === rangeEndKey.slice(0, 7)
      ? calendarTitleFormatter.format(getDateFromKey(rangeStartKey))
      : `${calendarTitleFormatter.format(
          getDateFromKey(rangeStartKey),
        )} - ${calendarTitleFormatter.format(getDateFromKey(rangeEndKey))}`
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
  const latestRecordedSession = sessions[0] ?? null
  const quickActionLabel = activeSessionStart ? 'Out' : 'In'
  const hasSelectedCorrections = selectedCorrectionDates.length > 0
  const hasSelectedRemovals = selectedRemovalDates.length > 0
  const activeSessionEntry = activeSessionStart
    ? {
        start: activeSessionStart,
        end: new Date(now).toISOString(),
      }
    : null
  const recordedDateKeys = buildRecordedDateKeys(
    activeSessionEntry ? [...sessions, activeSessionEntry] : sessions,
  )
  const calendarDays = buildCalendarDays(
    rangeStartKey,
    rangeEndKey,
    recordedDateKeys,
    selectedCorrectionDates,
    todayKey,
  )
  const visibleSessions = sessions.slice(0, 5)
  const latestActivityDuration = latestRecordedSession
    ? formatDuration(
        new Date(latestRecordedSession.end).getTime() -
          new Date(latestRecordedSession.start).getTime(),
      )
    : null
  const activityLineOne = activeSessionStart
    ? `Inside since ${formatDateTimeLabel(activeSessionStart)}`
    : latestRecordedSession
      ? `Last out ${formatDateTimeLabel(latestRecordedSession.end)}`
      : 'No stay logged yet'
  const activityLineTwo = activeSessionStart
    ? formatDuration(activeDurationMs, true)
    : latestActivityDuration ?? 'Timer ready'
  const correctionHelperText = hasSelectedCorrections
    ? 'Leave the fields blank to save each selected date as 24 hours.'
    : hasSelectedRemovals
      ? 'Tap save to remove the selected logged dates.'
      : 'Tap an empty date to log it, or a logged date to remove it.'

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

    setSessions((currentSessions) =>
      sortSessionsByStart([finishedSession, ...currentSessions]),
    )
    setActiveSessionStart(null)
  }

  function handleQuickToggle() {
    if (activeSessionStart) {
      handleExitDorm()
      return
    }

    handleEnterDorm()
  }

  function handleSelectCorrectionDate(dateKey) {
    const selectedDay = calendarDays.find((day) => day.dateKey === dateKey)

    if (!selectedDay || !selectedDay.isInRange) {
      return
    }

    if (selectedDay.hasRecorded) {
      setSelectedRemovalDates((currentDates) =>
        currentDates.includes(dateKey)
          ? currentDates.filter((currentDate) => currentDate !== dateKey)
          : [...currentDates, dateKey],
      )
      setSelectedCorrectionDates((currentDates) =>
        currentDates.filter((currentDate) => currentDate !== dateKey),
      )
    } else {
      setSelectedCorrectionDates((currentDates) =>
        currentDates.includes(dateKey)
          ? currentDates.filter((currentDate) => currentDate !== dateKey)
          : [...currentDates, dateKey],
      )
      setSelectedRemovalDates((currentDates) =>
        currentDates.filter((currentDate) => currentDate !== dateKey),
      )
    }

    setCorrectionError('')
  }

  function handleCorrectionSave(event) {
    event.preventDefault()

    if (!hasSelectedCorrections && !hasSelectedRemovals) {
      setCorrectionError('Select one or more dates first.')
      return
    }

    if (
      hasSelectedCorrections &&
      ((correctionStartTime && !correctionEndTime) ||
        (!correctionStartTime && correctionEndTime))
    ) {
      setCorrectionError('Enter both time in and time out, or leave them blank.')
      return
    }

    if (hasSelectedCorrections && correctionHours) {
      const parsedHours = Number(correctionHours)

      if (Number.isNaN(parsedHours) || parsedHours <= 0) {
        setCorrectionError('Hours stayed must be more than 0.')
        return
      }
    }

    setSessions((currentSessions) => {
      const selectedDateSet = new Set(selectedCorrectionDates)
      const selectedRemovalSet = new Set(selectedRemovalDates)
      const sessionsWithoutRemovedDates = currentSessions.flatMap((session) =>
        subtractSelectedDatesFromSession(session, selectedRemovalSet),
      )
      const sessionsWithoutSelectedManualDates = sessionsWithoutRemovedDates.filter(
        (session) =>
          !(
            session.source === 'manual' &&
            selectedDateSet.has(toDateKey(new Date(session.start)))
          ),
      )
      const addedSessions = selectedCorrectionDates.map((dateKey) => {
        const startDate = new Date(`${dateKey}T00:00:00`)
        let endDate = addDays(startDate, 1)

        if (correctionHours) {
          const parsedHours = Number(correctionHours)
          const safeHours = Math.min(parsedHours, 24)
          endDate = new Date(startDate.getTime() + safeHours * MS_IN_HOUR)
        } else if (correctionStartTime && correctionEndTime) {
          const customStart = new Date(`${dateKey}T${correctionStartTime}:00`)
          let customEnd = new Date(`${dateKey}T${correctionEndTime}:00`)

          if (customEnd <= customStart) {
            customEnd = addDays(customEnd, 1)
          }

          return {
            id: createSessionId(),
            start: customStart.toISOString(),
            end: customEnd.toISOString(),
            source: 'manual',
          }
        }

        return {
          id: createSessionId(),
          start: startDate.toISOString(),
          end: endDate.toISOString(),
          source: 'manual',
        }
      })

      return sortSessionsByStart([
        ...addedSessions,
        ...sessionsWithoutSelectedManualDates,
      ])
    })

    setCorrectionError('')
    setSelectedCorrectionDates([])
    setSelectedRemovalDates([])
    setCorrectionStartTime('')
    setCorrectionEndTime('')
    setCorrectionHours('')
  }

  return (
    <main className="app-shell">
      {step !== 'dashboard' ? (
        <section className="hero-panel">
          <div className="hero-copy">
            <h1>FairySplit</h1>
            <p className="hero-text">Split dorm bills by actual stay time.</p>
          </div>

          <div className="step-strip" aria-label="Project flow">
            <span className={step === 'identity' ? 'step-chip active' : 'step-chip'}>
              Name
            </span>
            <span className={step === 'room' ? 'step-chip active' : 'step-chip'}>
              Room
            </span>
            <span className={step === 'dashboard' ? 'step-chip active' : 'step-chip'}>
              Dashboard
            </span>
          </div>
        </section>
      ) : (
        <>
          <div className="dashboard-topbar">
            <button
              className="menu-button"
              type="button"
              aria-label="Open room menu"
              onClick={() => setShowRoomMenu(true)}
            >
              <span></span>
              <span></span>
              <span></span>
            </button>

            <div className="dashboard-brand">
              <h2>FairySplit</h2>
              <p>{displayName}</p>
            </div>
          </div>

          {showRoomMenu ? (
            <button
              className="drawer-backdrop"
              type="button"
              aria-label="Close room menu"
              onClick={() => setShowRoomMenu(false)}
            ></button>
          ) : null}

          <aside className={showRoomMenu ? 'room-drawer open' : 'room-drawer'}>
            <div className="drawer-header">
              <div>
                <p className="section-label">Rooms</p>
                <h3>Choose a room</h3>
              </div>
              <button
                className="secondary-button"
                type="button"
                onClick={() => setShowRoomMenu(false)}
              >
                Close
              </button>
            </div>

            <div className="drawer-room-list">
              {roomOptions.map((roomOption) => (
                <button
                  className={
                    roomOption.name === currentRoomName
                      ? 'drawer-room-button active'
                      : 'drawer-room-button'
                  }
                  key={roomOption.code}
                  type="button"
                  onClick={() => {
                    setRoomName(roomOption.name)
                    setRoomCode(roomOption.code)
                    setShowRoomMenu(false)
                  }}
                >
                  <strong>{roomOption.name}</strong>
                  <span>{roomOption.code}</span>
                </button>
              ))}
            </div>

            <button
              className="secondary-button full-width-button"
              type="button"
              onClick={() => {
                setShowRoomMenu(false)
                setStep('room')
              }}
            >
              Add or edit room
            </button>
          </aside>
        </>
      )}

      {step === 'identity' && (
        <section className="screen-card">
          <div className="screen-heading">
            <h2>Your name</h2>
            <p>Enter the name your roommates will recognize.</p>
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
            <h2>Choose a room</h2>
            <p>Create a new room or join with a code.</p>
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
          <article className="quick-focus-card quick-focus-single">
            <button
              className={
                activeSessionStart
                  ? 'quick-toggle-button active'
                  : 'quick-toggle-button'
              }
              type="button"
              onClick={handleQuickToggle}
              aria-label={quickActionLabel}
            >
              <strong>{quickActionLabel}</strong>
              <span className="quick-toggle-bottom">{activityLineOne}</span>
              <span className="quick-toggle-meta">{activityLineTwo}</span>
            </button>
          </article>

          <article className="correction-card">
            <div className="panel-header with-action">
              <div>
                <h3>Correction calendar</h3>
              </div>
              <button
                className="secondary-button"
                type="button"
                onClick={() =>
                  setShowCorrectionCalendar((currentValue) => !currentValue)
                }
              >
                {showCorrectionCalendar
                  ? 'Hide correction calendar'
                  : 'Open correction calendar'}
              </button>
            </div>

            {showCorrectionCalendar ? (
              <>
                {hasSelectedCorrections ? (
                  <div className="correction-toolbar reveal-panel">
                    <label className="field">
                      <span>Time in</span>
                      <input
                        type="time"
                        value={correctionStartTime}
                        disabled={Boolean(correctionHours)}
                        onChange={(event) => setCorrectionStartTime(event.target.value)}
                      />
                    </label>

                    <label className="field">
                      <span>Time out</span>
                      <input
                        type="time"
                        value={correctionEndTime}
                        disabled={Boolean(correctionHours)}
                        onChange={(event) => setCorrectionEndTime(event.target.value)}
                      />
                    </label>

                    <label className="field">
                      <span>Hours stayed</span>
                      <input
                        type="number"
                        min="0.5"
                        max="24"
                        step="0.5"
                        value={correctionHours}
                        disabled={Boolean(correctionStartTime || correctionEndTime)}
                        onChange={(event) => setCorrectionHours(event.target.value)}
                      />
                    </label>
                  </div>
                ) : null}

                <div className="correction-layout reveal-panel">
                  <div className="calendar-card">
                    <div className="calendar-header">
                      <div>
                        <strong>{calendarTitle}</strong>
                        <p>{correctionHelperText}</p>
                      </div>
                    </div>

                    <div className="calendar-weekdays">
                      {weekdayLabels.map((dayLabel) => (
                        <span className="weekday-chip" key={dayLabel}>
                          {dayLabel}
                        </span>
                      ))}
                    </div>

                    <div className="calendar-grid">
                      {calendarDays.map((day) => (
                        <button
                          className={
                            day.isInRange
                              ? `calendar-day${day.hasRecorded ? ' recorded' : ''}${
                                  day.isSelected ? ' selected' : ''
                                }${
                                  selectedRemovalDates.includes(day.dateKey)
                                    ? ' remove-marked'
                                    : ''
                                }${day.isToday ? ' today' : ''}`
                              : 'calendar-day muted'
                          }
                          disabled={!day.isInRange}
                          key={day.dateKey}
                          type="button"
                          onClick={() => handleSelectCorrectionDate(day.dateKey)}
                        >
                          <span className="calendar-day-number">{day.dayNumber}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="editor-card">
                    <p className="section-label">Selected dates</p>
                    <h3>
                      {!hasSelectedCorrections && !hasSelectedRemovals
                        ? 'Nothing selected'
                        : `${selectedCorrectionDates.length} add / ${selectedRemovalDates.length} remove`}
                    </h3>

                    <div className="selected-date-list">
                      {hasSelectedCorrections || hasSelectedRemovals ? (
                        <>
                          {selectedCorrectionDates
                            .slice()
                            .sort()
                            .map((dateKey) => (
                              <span className="selected-date-chip" key={dateKey}>
                                {formatDateLabel(dateKey)}
                              </span>
                            ))}
                          {selectedRemovalDates
                            .slice()
                            .sort()
                            .map((dateKey) => (
                              <span
                                className="selected-date-chip remove-chip"
                                key={dateKey}
                              >
                                {formatDateLabel(dateKey)}
                              </span>
                            ))}
                        </>
                      ) : (
                        <p className="editor-note">No pending calendar changes.</p>
                      )}
                    </div>

                    {correctionError ? (
                      <p className="error-text">{correctionError}</p>
                    ) : null}

                    <form className="stack" onSubmit={handleCorrectionSave}>
                      <button
                        className="primary-button"
                        type="submit"
                        disabled={!hasSelectedCorrections && !hasSelectedRemovals}
                      >
                        Save calendar changes
                      </button>
                    </form>
                  </div>
                </div>
              </>
            ) : null}
          </article>

          <div className="room-banner compact-banner">
            <div>
              <h2>{currentRoomName}</h2>
              <p>
                Code: <strong>{roomCode || 'Not set yet'}</strong>
              </p>
            </div>
            <div className="room-meta">
              <span className="focus-pill">Bill cycle {billPeriodLabel}</span>
            </div>
          </div>

          <div className="dashboard-columns">
            <article className="panel">
              <div className="panel-header">
                <h3>Recent logs</h3>
              </div>

              <div className="history-list compact-scroll">
                {activeSessionStart ? (
                  <div className="history-row active-history">
                    <div>
                      <strong>Active stay</strong>
                      <p>Started {formatDateTimeLabel(activeSessionStart)}</p>
                    </div>
                    <strong>{formatDuration(activeDurationMs, true)}</strong>
                  </div>
                ) : null}

                {visibleSessions.map((session) => (
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

            <article className="panel">
              <div className="panel-header with-action">
                <div>
                  <h3>{billName}</h3>
                </div>
                <button
                  className="secondary-button"
                  type="button"
                  onClick={() => setShowBillSettings((currentValue) => !currentValue)}
                >
                  {showBillSettings ? 'Hide bill settings' : 'Edit bill settings'}
                </button>
              </div>

              <div className="summary-grid triple-grid">
                <div className="summary-box">
                  <span className="summary-label">Billing period</span>
                  <strong>{billPeriodLabel}</strong>
                </div>
                <div className="summary-box">
                  <span className="summary-label">Total bill</span>
                  <strong>{currencyFormatter.format(parsedBillAmount)}</strong>
                </div>
                <div className="summary-box">
                  <span className="summary-label">Your estimate</span>
                  <strong>{currencyFormatter.format(yourRow.totalShare)}</strong>
                </div>
              </div>

              {showBillSettings ? (
                <div className="settings-drawer reveal-panel">
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
                    Always-on costs are shared equally.
                  </p>
                </div>
              ) : null}

              <div className="calculation-card">
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
            </article>
          </div>
        </section>
      )}
    </main>
  )
}

export default App
