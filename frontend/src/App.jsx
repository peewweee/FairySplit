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

function getMonthRangeKeys(referenceDate = new Date()) {
  const monthStart = new Date(referenceDate)
  monthStart.setDate(1)
  monthStart.setHours(0, 0, 0, 0)

  const monthEnd = new Date(referenceDate)
  monthEnd.setMonth(monthEnd.getMonth() + 1, 0)
  monthEnd.setHours(0, 0, 0, 0)

  return {
    startKey: toDateKey(monthStart),
    endKey: toDateKey(monthEnd),
  }
}

function normalizeDateRange(startKey, endKey) {
  const fallbackKey = toDateKey(new Date())
  const safeStartKey = startKey || endKey || fallbackKey
  const safeEndKey = endKey || safeStartKey

  return safeStartKey <= safeEndKey
    ? { startKey: safeStartKey, endKey: safeEndKey }
    : { startKey: safeEndKey, endKey: safeStartKey }
}

function formatDateRangeLabel(startKey, endKey) {
  const normalizedRange = normalizeDateRange(startKey, endKey)

  return `${formatDateLabel(normalizedRange.startKey)} - ${formatDateLabel(
    normalizedRange.endKey,
  )}`
}

function createBillDraft(referenceDate = new Date()) {
  const { startKey, endKey } = getMonthRangeKeys(referenceDate)

  return {
    name: '',
    amount: '',
    start: startKey,
    end: endKey,
  }
}

function getDurationInRange(entries, startKey, endKey) {
  const normalizedRange = normalizeDateRange(startKey, endKey)
  const rangeStartTime = getDateFromKey(normalizedRange.startKey).getTime()
  const rangeEndTime = addDays(
    getDateFromKey(normalizedRange.endKey),
    1,
  ).getTime()

  return entries.reduce((total, entry) => {
    const entryStartTime = new Date(entry.start).getTime()
    const entryEndTime = new Date(entry.end).getTime()
    const overlapStartTime = Math.max(entryStartTime, rangeStartTime)
    const overlapEndTime = Math.min(entryEndTime, rangeEndTime)

    return total + Math.max(0, overlapEndTime - overlapStartTime)
  }, 0)
}

function createSessionId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }

  return `stay-${Date.now()}`
}

function createBillId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }

  return `bill-${Date.now()}`
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
  const [bills, setBills] = useState([])
  const [activeBillEditor, setActiveBillEditor] = useState(null)
  const [billDraft, setBillDraft] = useState(() => createBillDraft())
  const [billFormError, setBillFormError] = useState('')
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
  const [billScrollProgress, setBillScrollProgress] = useState(0)
  const [openBillBreakdowns, setOpenBillBreakdowns] = useState([])

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
  const roomMembers = [
    { name: displayName, isCurrentUser: true, defaultDays: null },
    ...otherResidents.map((resident) => ({
      name: resident.name,
      isCurrentUser: false,
      defaultDays: resident.days,
    })),
  ]
  const { startKey: calendarStartKey, endKey: calendarEndKey } =
    getMonthRangeKeys(new Date(now))
  const calendarTitle =
    calendarStartKey.slice(0, 7) === calendarEndKey.slice(0, 7)
      ? calendarTitleFormatter.format(getDateFromKey(calendarStartKey))
      : `${calendarTitleFormatter.format(
          getDateFromKey(calendarStartKey),
        )} - ${calendarTitleFormatter.format(getDateFromKey(calendarEndKey))}`

  const activeDurationMs = activeSessionStart
    ? Math.max(0, now - new Date(activeSessionStart).getTime())
    : 0
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
  const trackedEntries = activeSessionEntry
    ? [...sessions, activeSessionEntry]
    : sessions
  const billCards = bills.map((bill) => {
    const memberNames = bill.memberNames ?? [bill.createdBy].filter(Boolean)
    const totalBillAmount = Number(bill.amount) || 0
    const shareRows = roomMembers.map((member) => {
      const stayedDays = member.isCurrentUser
        ? getDurationInRange(trackedEntries, bill.start, bill.end) / MS_IN_DAY
        : member.defaultDays ?? 0

      return {
        name: member.name,
        isCurrentUser: member.isCurrentUser,
        joined: memberNames.includes(member.name),
        stayedDays,
      }
    })
    const joinedRows = shareRows.filter((row) => row.joined)
    const totalBillDays = joinedRows.reduce(
      (total, row) => total + row.stayedDays,
      0,
    )
    const detailedShareRows = shareRows.map((row) => ({
      ...row,
      share:
        row.joined && totalBillDays
          ? (row.stayedDays / totalBillDays) * totalBillAmount
          : 0,
    }))
    const yourRow =
      detailedShareRows.find(
        (row) => row.isCurrentUser && row.joined,
      ) ?? null

    return {
      ...bill,
      total: totalBillAmount,
      memberNames,
      memberCount: joinedRows.length,
      periodLabel: formatDateRangeLabel(bill.start, bill.end),
      viewerJoined: memberNames.includes(displayName),
      yourShare: yourRow?.share ?? null,
      shareRows: detailedShareRows,
    }
  })
  const totalBillPanels = billCards.length + 1
  const billIndicatorWidth =
    totalBillPanels > 1 ? Math.max(26, 100 / totalBillPanels) : 100
  const billIndicatorOffset = (100 - billIndicatorWidth) * billScrollProgress
  const recordedDateKeys = buildRecordedDateKeys(trackedEntries)
  const calendarDays = buildCalendarDays(
    calendarStartKey,
    calendarEndKey,
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

  function resetBillEditor() {
    setActiveBillEditor(null)
    setBillDraft(createBillDraft(new Date(now)))
    setBillFormError('')
  }

  function handleOpenBillCreator() {
    if (activeBillEditor?.mode === 'create') {
      resetBillEditor()
      return
    }

    setActiveBillEditor({ mode: 'create' })
    setBillDraft(createBillDraft(new Date(now)))
    setBillFormError('')
  }

  function handleToggleBillEditor(bill) {
    if (
      activeBillEditor?.mode === 'edit' &&
      activeBillEditor.billId === bill.id
    ) {
      resetBillEditor()
      return
    }

    setActiveBillEditor({ mode: 'edit', billId: bill.id })
    setBillDraft({
      name: bill.name,
      amount: String(bill.amount),
      start: bill.start,
      end: bill.end,
    })
    setBillFormError('')
  }

  function handleBillDraftChange(field, value) {
    setBillDraft((currentDraft) => ({
      ...currentDraft,
      [field]: value,
    }))
    setBillFormError('')
  }

  function buildBillPayload() {
    const trimmedBillName = billDraft.name.trim()
    const parsedAmount = Number(billDraft.amount)

    if (!trimmedBillName) {
      setBillFormError('Enter a bill name.')
      return null
    }

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setBillFormError('Enter a total bill amount greater than 0.')
      return null
    }

    const normalizedRange = normalizeDateRange(billDraft.start, billDraft.end)

    return {
      name: trimmedBillName,
      amount: parsedAmount,
      start: normalizedRange.startKey,
      end: normalizedRange.endKey,
    }
  }

  function handleBillSave(event) {
    event.preventDefault()

    if (!activeBillEditor) {
      return
    }

    const nextBill = buildBillPayload()

    if (!nextBill) {
      return
    }

    if (activeBillEditor.mode === 'create') {
      setBills((currentBills) => [
        ...currentBills,
        {
          id: createBillId(),
          createdBy: displayName,
          memberNames: [displayName],
          ...nextBill,
        },
      ])
    } else {
      setBills((currentBills) =>
        currentBills.map((bill) =>
          bill.id === activeBillEditor.billId ? { ...bill, ...nextBill } : bill,
        ),
      )
    }

    resetBillEditor()
  }

  function handleToggleBillBreakdown(billId) {
    setOpenBillBreakdowns((currentIds) =>
      currentIds.includes(billId)
        ? currentIds.filter((currentId) => currentId !== billId)
        : [...currentIds, billId],
    )
  }

  function handleToggleBillMember(billId, memberName) {
    const orderedRoomMemberNames = roomMembers.map((member) => member.name)
    const isRemovingSelf =
      memberName === displayName &&
      billCards.find((bill) => bill.id === billId)?.viewerJoined

    setBills((currentBills) =>
      currentBills.map((bill) => {
        if (bill.id !== billId) {
          return bill
        }

        const currentMemberNames = bill.memberNames ?? []
        const isJoined = currentMemberNames.includes(memberName)
        const nextMemberNames = isJoined
          ? currentMemberNames.filter((currentName) => currentName !== memberName)
          : orderedRoomMemberNames.filter(
              (currentName) =>
                currentName === memberName ||
                currentMemberNames.includes(currentName),
            )

        return {
          ...bill,
          memberNames: nextMemberNames,
        }
      }),
    )

    if (
      isRemovingSelf &&
      activeBillEditor?.mode === 'edit' &&
      activeBillEditor.billId === billId
    ) {
      resetBillEditor()
    }
  }

  function handleBillScroll(event) {
    const maxScrollLeft =
      event.currentTarget.scrollWidth - event.currentTarget.clientWidth

    setBillScrollProgress(
      maxScrollLeft > 0 ? event.currentTarget.scrollLeft / maxScrollLeft : 0,
    )
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
          <article className="room-card">
            <div className="room-card-header">
              <div>
                <p className="section-label">Room</p>
                <div className="room-title-row">
                  <h2>{currentRoomName}</h2>
                  <span className="room-code-chip">
                    {roomCode || 'Code not set'}
                  </span>
                </div>
              </div>
            </div>

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

            <div className="accordion-block">
              <button
                className="accordion-toggle"
                type="button"
                aria-expanded={showCorrectionCalendar}
                onClick={() =>
                  setShowCorrectionCalendar((currentValue) => !currentValue)
                }
              >
                <div>
                  <p className="section-label">Manual input of dates</p>
                  <h3>Correction calendar</h3>
                </div>
                <span
                  className={
                    showCorrectionCalendar
                      ? 'accordion-chevron open'
                      : 'accordion-chevron'
                  }
                  aria-hidden="true"
                ></span>
              </button>

              {showCorrectionCalendar ? (
                <div className="correction-stack reveal-panel">
                  {hasSelectedCorrections ? (
                    <div className="correction-toolbar">
                      <label className="field">
                        <span>Time in</span>
                        <input
                          type="time"
                          value={correctionStartTime}
                          disabled={Boolean(correctionHours)}
                          onChange={(event) =>
                            setCorrectionStartTime(event.target.value)
                          }
                        />
                      </label>

                      <label className="field">
                        <span>Time out</span>
                        <input
                          type="time"
                          value={correctionEndTime}
                          disabled={Boolean(correctionHours)}
                          onChange={(event) =>
                            setCorrectionEndTime(event.target.value)
                          }
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

                  <div className="correction-layout">
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
                            <span className="calendar-day-number">
                              {day.dayNumber}
                            </span>
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
                </div>
              ) : null}
            </div>
          </article>

          <article className="panel bills-panel">
            <div className="panel-header">
              <div>
                <p className="section-label">Bills</p>
                <h3>Shared bills</h3>
              </div>
            </div>

            <div className="bill-scroll-shell">
              <div className="bill-scroll-row" onScroll={handleBillScroll}>
                {billCards.map((billCard) => {
                  const isEditingBill =
                    activeBillEditor?.mode === 'edit' &&
                    activeBillEditor.billId === billCard.id
                  const isBreakdownOpen = openBillBreakdowns.includes(billCard.id)

                  return (
                    <article className="bill-card featured" key={billCard.id}>
                      <div className="bill-card-top">
                        <div>
                          <p className="section-label">Bill</p>
                          <h4>{billCard.name}</h4>
                        </div>
                        <span className="bill-pill">
                          {billCard.memberCount} sharing
                        </span>
                      </div>

                      <div className="bill-card-values">
                        <span>Total bill</span>
                        <strong>{currencyFormatter.format(billCard.total)}</strong>
                      </div>

                      <div className="bill-card-values">
                        <span>Bill date range</span>
                        <strong className="bill-card-inline">
                          {billCard.periodLabel}
                        </strong>
                      </div>

                      <div className="bill-card-values">
                        <span>Your share</span>
                        {billCard.viewerJoined ? (
                          <div className="bill-share-actions">
                            <strong>
                              {currencyFormatter.format(billCard.yourShare ?? 0)}
                            </strong>
                            <button
                              className="bill-link-button"
                              type="button"
                              onClick={() =>
                                handleToggleBillMember(billCard.id, displayName)
                              }
                            >
                              Leave
                            </button>
                          </div>
                        ) : (
                          <div className="bill-share-cta">
                            <span className="bill-join-note">
                              Join to see your share
                            </span>
                            <button
                              className="secondary-button bill-join-button"
                              type="button"
                              onClick={() =>
                                handleToggleBillMember(billCard.id, displayName)
                              }
                            >
                              Join
                            </button>
                          </div>
                        )}
                      </div>

                      <button
                        className="bill-card-toggle"
                        type="button"
                        aria-expanded={isBreakdownOpen}
                        onClick={() => handleToggleBillBreakdown(billCard.id)}
                      >
                        <span>Everyone&apos;s share</span>
                        <span
                          className={
                            isBreakdownOpen
                              ? 'accordion-chevron open'
                              : 'accordion-chevron'
                          }
                          aria-hidden="true"
                        ></span>
                      </button>

                      {isBreakdownOpen ? (
                        <div className="bill-breakdown-list reveal-panel">
                          {billCard.shareRows.map((shareRow) => {
                            const canManageMember =
                              billCard.viewerJoined || shareRow.isCurrentUser

                            return (
                              <div
                                className={
                                  shareRow.joined
                                    ? 'bill-breakdown-row'
                                    : 'bill-breakdown-row muted'
                                }
                                key={`${billCard.id}-${shareRow.name}`}
                              >
                                <div>
                                  <strong>
                                    {shareRow.isCurrentUser
                                      ? `${shareRow.name} (You)`
                                      : shareRow.name}
                                  </strong>
                                  <p>
                                    {shareRow.joined
                                      ? `${shareRow.stayedDays.toFixed(2)} days`
                                      : 'Not included in this bill'}
                                  </p>
                                </div>

                                <div className="bill-breakdown-actions">
                                  <strong>
                                    {shareRow.joined
                                      ? currencyFormatter.format(shareRow.share)
                                      : '-'}
                                  </strong>

                                  {canManageMember ? (
                                    <button
                                      className="bill-link-button"
                                      type="button"
                                      onClick={() =>
                                        handleToggleBillMember(
                                          billCard.id,
                                          shareRow.name,
                                        )
                                      }
                                    >
                                      {shareRow.joined
                                        ? shareRow.isCurrentUser
                                          ? 'Leave'
                                          : 'Remove'
                                        : shareRow.isCurrentUser
                                          ? 'Join'
                                          : 'Add'}
                                    </button>
                                  ) : null}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      ) : null}

                      {billCard.viewerJoined ? (
                        <button
                          className="bill-card-toggle"
                          type="button"
                          aria-expanded={isEditingBill}
                          onClick={() => handleToggleBillEditor(billCard)}
                        >
                          <span>Edit bill details</span>
                          <span
                            className={
                              isEditingBill
                                ? 'accordion-chevron open'
                                : 'accordion-chevron'
                            }
                            aria-hidden="true"
                          ></span>
                        </button>
                      ) : null}

                      {isEditingBill ? (
                        <form className="stack reveal-panel" onSubmit={handleBillSave}>
                          <label className="field">
                            <span>Bill name</span>
                            <input
                              type="text"
                              value={billDraft.name}
                              onChange={(event) =>
                                handleBillDraftChange('name', event.target.value)
                              }
                            />
                          </label>

                          <label className="field">
                            <span>Total bill</span>
                            <input
                              type="number"
                              min="0"
                              value={billDraft.amount}
                              onChange={(event) =>
                                handleBillDraftChange('amount', event.target.value)
                              }
                            />
                          </label>

                          <div className="two-column-form compact-form">
                            <label className="field">
                              <span>Start date</span>
                              <input
                                type="date"
                                value={billDraft.start}
                                onChange={(event) =>
                                  handleBillDraftChange('start', event.target.value)
                                }
                              />
                            </label>

                            <label className="field">
                              <span>End date</span>
                              <input
                                type="date"
                                value={billDraft.end}
                                onChange={(event) =>
                                  handleBillDraftChange('end', event.target.value)
                                }
                              />
                            </label>
                          </div>

                          {billFormError ? (
                            <p className="error-text">{billFormError}</p>
                          ) : null}

                          <div className="inline-actions">
                            <button
                              className="secondary-button"
                              type="button"
                              onClick={resetBillEditor}
                            >
                              Cancel
                            </button>
                            <button className="primary-button" type="submit">
                              Save bill
                            </button>
                          </div>
                        </form>
                      ) : null}
                    </article>
                  )
                })}

                <article
                  className={
                    activeBillEditor?.mode === 'create'
                      ? 'bill-card add-bill-card open'
                      : 'bill-card add-bill-card'
                  }
                >
                  {activeBillEditor?.mode === 'create' ? (
                    <form className="stack reveal-panel" onSubmit={handleBillSave}>
                      <div className="bill-card-top">
                        <div>
                          <p className="section-label">New bill</p>
                          <h4>Add bill</h4>
                        </div>
                        <button
                          className="bill-card-close"
                          type="button"
                          aria-label="Close bill form"
                          onClick={resetBillEditor}
                        >
                          X
                        </button>
                      </div>

                      <label className="field">
                        <span>Bill name</span>
                        <input
                          type="text"
                          value={billDraft.name}
                          onChange={(event) =>
                            handleBillDraftChange('name', event.target.value)
                          }
                        />
                      </label>

                      <label className="field">
                        <span>Total bill</span>
                        <input
                          type="number"
                          min="0"
                          value={billDraft.amount}
                          onChange={(event) =>
                            handleBillDraftChange('amount', event.target.value)
                          }
                        />
                      </label>

                      <div className="two-column-form compact-form">
                        <label className="field">
                          <span>Start date</span>
                          <input
                            type="date"
                            value={billDraft.start}
                            onChange={(event) =>
                              handleBillDraftChange('start', event.target.value)
                            }
                          />
                        </label>

                        <label className="field">
                          <span>End date</span>
                          <input
                            type="date"
                            value={billDraft.end}
                            onChange={(event) =>
                              handleBillDraftChange('end', event.target.value)
                            }
                          />
                        </label>
                      </div>

                      {billFormError ? (
                        <p className="error-text">{billFormError}</p>
                      ) : null}

                      <button className="primary-button" type="submit">
                        Create bill
                      </button>
                    </form>
                  ) : (
                    <button
                      className="add-bill-button"
                      type="button"
                      onClick={handleOpenBillCreator}
                    >
                      <span className="add-bill-mark">+</span>
                      <span>Add new bill</span>
                    </button>
                  )}
                </article>
              </div>

              {totalBillPanels > 1 ? (
                <div className="scroll-indicator" aria-hidden="true">
                  <span className="scroll-indicator-track">
                    <span
                      className="scroll-indicator-thumb"
                      style={{
                        width: `${billIndicatorWidth}%`,
                        transform: `translateX(${billIndicatorOffset}%)`,
                      }}
                    ></span>
                  </span>
                </div>
              ) : null}
            </div>
          </article>

          <article className="panel">
            <div className="panel-header">
              <div>
                <p className="section-label">History</p>
                <h3>Recent logs</h3>
              </div>
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
        </section>
      )}
    </main>
  )
}

export default App
