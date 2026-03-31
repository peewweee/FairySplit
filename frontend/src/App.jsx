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

function addMonths(date, amount) {
  const nextDate = new Date(date)
  nextDate.setDate(1)
  nextDate.setMonth(nextDate.getMonth() + amount)
  nextDate.setHours(0, 0, 0, 0)
  return nextDate
}

function startOfMonth(date) {
  const monthStart = new Date(date)
  monthStart.setDate(1)
  monthStart.setHours(0, 0, 0, 0)
  return monthStart
}

function endOfMonth(date) {
  const monthEnd = startOfMonth(date)
  monthEnd.setMonth(monthEnd.getMonth() + 1, 0)
  monthEnd.setHours(0, 0, 0, 0)
  return monthEnd
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

function formatDailyTimer(ms) {
  const safeMs = Math.max(0, ms)
  const totalSeconds = Math.floor((safeMs % MS_IN_DAY) / MS_IN_SECOND)
  const hours = Math.floor(totalSeconds / (MS_IN_HOUR / MS_IN_SECOND))
  const minutes = Math.floor(
    (totalSeconds % (MS_IN_HOUR / MS_IN_SECOND)) /
      (MS_IN_MINUTE / MS_IN_SECOND),
  )
  const seconds = totalSeconds % (MS_IN_MINUTE / MS_IN_SECOND)

  return `${padNumber(hours)}h ${padNumber(minutes)}m ${padNumber(seconds)}s`
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

function createCorrectionDraft() {
  return {
    mode: 'full-day',
    startTime: '',
    endTime: '',
    hours: '',
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

function buildCalendarMonths(
  rangeStartDate,
  rangeEndDate,
  recordedDateKeys,
  selectedDateKeys,
  selectedRemovalDates,
  todayKey,
) {
  const monthSections = []
  const selectedRemovalSet = new Set(selectedRemovalDates)
  let monthCursor = startOfMonth(rangeStartDate)
  const lastMonth = startOfMonth(rangeEndDate)

  while (monthCursor <= lastMonth) {
    const monthStartKey = toDateKey(startOfMonth(monthCursor))
    const monthEndKey = toDateKey(endOfMonth(monthCursor))
    const monthDays = buildCalendarDays(
      monthStartKey,
      monthEndKey,
      recordedDateKeys,
      selectedDateKeys,
      todayKey,
    ).map((day) => ({
      ...day,
      isInCurrentMonth:
        getDateFromKey(day.dateKey).getMonth() === monthCursor.getMonth() &&
        getDateFromKey(day.dateKey).getFullYear() === monthCursor.getFullYear(),
      isMarkedForRemoval: selectedRemovalSet.has(day.dateKey),
    }))

    monthSections.push({
      monthKey: `${monthCursor.getFullYear()}-${padNumber(monthCursor.getMonth() + 1)}`,
      title: calendarTitleFormatter.format(monthCursor),
      days: monthDays,
    })

    monthCursor = addMonths(monthCursor, 1)
  }

  return monthSections
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
  const [step, setStep] = useState('room')
  const [draftName, setDraftName] = useState('')
  const [userName, setUserName] = useState('')
  const [themeMode, setThemeMode] = useState(() => {
    if (typeof window === 'undefined') {
      return 'light'
    }

    return window.localStorage.getItem('fairysplit-theme') ?? 'light'
  })
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
  const [correctionDetailsByDate, setCorrectionDetailsByDate] = useState({})
  const [correctionError, setCorrectionError] = useState('')
  const [billScrollProgress, setBillScrollProgress] = useState(0)
  const [openBillBreakdowns, setOpenBillBreakdowns] = useState([])
  const [roomCodeCopied, setRoomCodeCopied] = useState(false)

  useEffect(() => {
    if (!activeSessionStart) {
      return undefined
    }

    const intervalId = window.setInterval(() => {
      setNow(Date.now())
    }, MS_IN_SECOND)

    return () => window.clearInterval(intervalId)
  }, [activeSessionStart])

  useEffect(() => {
    document.body.classList.toggle('theme-dark', themeMode === 'dark')
    window.localStorage.setItem('fairysplit-theme', themeMode)
  }, [themeMode])

  useEffect(() => {
    if (!roomCodeCopied) {
      return undefined
    }

    const timeoutId = window.setTimeout(() => {
      setRoomCodeCopied(false)
    }, 1400)

    return () => window.clearTimeout(timeoutId)
  }, [roomCodeCopied])

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
  const calendarBoundaryDates = [
    startOfMonth(addMonths(new Date(now), -1)),
    endOfMonth(addMonths(new Date(now), 1)),
  ]

  trackedEntries.forEach((entry) => {
    calendarBoundaryDates.push(startOfMonth(new Date(entry.start)))
    calendarBoundaryDates.push(endOfMonth(new Date(entry.end)))
  })

  bills.forEach((bill) => {
    const normalizedRange = normalizeDateRange(bill.start, bill.end)
    calendarBoundaryDates.push(
      startOfMonth(getDateFromKey(normalizedRange.startKey)),
    )
    calendarBoundaryDates.push(endOfMonth(getDateFromKey(normalizedRange.endKey)))
  })

  const calendarRangeStart = new Date(
    Math.min(...calendarBoundaryDates.map((date) => date.getTime())),
  )
  const calendarRangeEnd = new Date(
    Math.max(...calendarBoundaryDates.map((date) => date.getTime())),
  )
  const calendarRangeStartKey = toDateKey(startOfMonth(calendarRangeStart))
  const calendarRangeEndKey = toDateKey(endOfMonth(calendarRangeEnd))
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
  const recordedDateKeys = buildRecordedDateKeys(sessions)
  const calendarMonths = buildCalendarMonths(
    calendarRangeStart,
    calendarRangeEnd,
    recordedDateKeys,
    selectedCorrectionDates,
    selectedRemovalDates,
    todayKey,
  )
  const selectedCorrectionCards = selectedCorrectionDates
    .slice()
    .sort()
    .map((dateKey) => ({
      dateKey,
      draft: correctionDetailsByDate[dateKey] ?? createCorrectionDraft(),
    }))
  const selectedRemovalCards = selectedRemovalDates.slice().sort()
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
    ? `${formatDailyTimer(activeDurationMs)} today`
    : latestActivityDuration
      ? `Last stay ${latestActivityDuration}`
      : 'Ready for your next log'

  function handleRoomSubmit(event) {
    event.preventDefault()
    const trimmedName = draftName.trim()

    if (!trimmedName) {
      return
    }

    if (roomAction === 'create' && !roomName.trim()) {
      return
    }

    if (roomAction === 'join' && !roomCode.trim()) {
      return
    }

    setUserName(trimmedName)
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

  function handleCorrectionDraftModeChange(dateKey, mode) {
    setCorrectionDetailsByDate((currentDrafts) => {
      const currentDraft = currentDrafts[dateKey] ?? createCorrectionDraft()

      if (mode === 'full-day') {
        return {
          ...currentDrafts,
          [dateKey]: {
            ...currentDraft,
            mode,
            startTime: '',
            endTime: '',
            hours: '',
          },
        }
      }

      if (mode === 'range') {
        return {
          ...currentDrafts,
          [dateKey]: {
            ...currentDraft,
            mode,
            hours: '',
          },
        }
      }

      return {
        ...currentDrafts,
        [dateKey]: {
          ...currentDraft,
          mode,
          startTime: '',
          endTime: '',
        },
      }
    })
    setCorrectionError('')
  }

  function handleCorrectionDraftChange(dateKey, field, value) {
    setCorrectionDetailsByDate((currentDrafts) => {
      const currentDraft = currentDrafts[dateKey] ?? createCorrectionDraft()
      const nextDraft = {
        ...currentDraft,
        [field]: value,
      }

      if (field === 'hours' && value) {
        nextDraft.mode = 'hours'
        nextDraft.startTime = ''
        nextDraft.endTime = ''
      }

      if ((field === 'startTime' || field === 'endTime') && value) {
        nextDraft.mode = 'range'
        nextDraft.hours = ''
      }

      return {
        ...currentDrafts,
        [dateKey]: nextDraft,
      }
    })
    setCorrectionError('')
  }

  function handleSelectCorrectionDate(dateKey) {
    if (dateKey < calendarRangeStartKey || dateKey > calendarRangeEndKey) {
      return
    }

    if (recordedDateKeys.has(dateKey)) {
      const isMarkedForRemoval = selectedRemovalDates.includes(dateKey)

      setSelectedRemovalDates((currentDates) =>
        isMarkedForRemoval
          ? currentDates.filter((currentDate) => currentDate !== dateKey)
          : [...currentDates, dateKey].sort(),
      )
      setSelectedCorrectionDates((currentDates) =>
        currentDates.filter((currentDate) => currentDate !== dateKey),
      )
      setCorrectionDetailsByDate((currentDrafts) => {
        if (!currentDrafts[dateKey]) {
          return currentDrafts
        }

        const nextDrafts = { ...currentDrafts }
        delete nextDrafts[dateKey]
        return nextDrafts
      })
    } else {
      const isSelectedForCorrection = selectedCorrectionDates.includes(dateKey)

      setSelectedCorrectionDates((currentDates) =>
        isSelectedForCorrection
          ? currentDates.filter((currentDate) => currentDate !== dateKey)
          : [...currentDates, dateKey].sort(),
      )
      setSelectedRemovalDates((currentDates) =>
        currentDates.filter((currentDate) => currentDate !== dateKey),
      )
      setCorrectionDetailsByDate((currentDrafts) => {
        if (isSelectedForCorrection) {
          const nextDrafts = { ...currentDrafts }
          delete nextDrafts[dateKey]
          return nextDrafts
        }

        return {
          ...currentDrafts,
          [dateKey]: currentDrafts[dateKey] ?? createCorrectionDraft(),
        }
      })
    }

    setCorrectionError('')
  }

  function handleCorrectionSave(event) {
    event.preventDefault()

    if (!hasSelectedCorrections && !hasSelectedRemovals) {
      setCorrectionError('Select one or more dates first.')
      return
    }

    const invalidDraft = selectedCorrectionCards.find(({ draft }) => {
      if (draft.mode === 'range') {
        return !draft.startTime || !draft.endTime
      }

      if (draft.mode === 'hours') {
        const parsedHours = Number(draft.hours)
        return (
          !draft.hours ||
          Number.isNaN(parsedHours) ||
          parsedHours <= 0 ||
          parsedHours > 24
        )
      }

      return false
    })

    if (invalidDraft) {
      const { dateKey, draft } = invalidDraft

      if (draft.mode === 'range') {
        setCorrectionError(
          `Add both time in and time out for ${formatDateLabel(dateKey)}.`,
        )
        return
      }

      setCorrectionError(
        `Hours stayed for ${formatDateLabel(dateKey)} must be between 0.5 and 24.`,
      )
      return
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
      const addedSessions = selectedCorrectionCards.map(({ dateKey, draft }) => {
        const startDate = new Date(`${dateKey}T00:00:00`)

        if (draft.mode === 'range') {
          const customStart = new Date(`${dateKey}T${draft.startTime}:00`)
          let customEnd = new Date(`${dateKey}T${draft.endTime}:00`)

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

        if (draft.mode === 'hours') {
          const parsedHours = Number(draft.hours)
          const safeHours = Math.min(parsedHours, 24)
          const endDate = new Date(startDate.getTime() + safeHours * MS_IN_HOUR)

          return {
            id: createSessionId(),
            start: startDate.toISOString(),
            end: endDate.toISOString(),
            source: 'manual',
          }
        }

        return {
          id: createSessionId(),
          start: startDate.toISOString(),
          end: addDays(startDate, 1).toISOString(),
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
    setCorrectionDetailsByDate({})
    setShowCorrectionCalendar(false)
  }

  async function handleCopyRoomCode() {
    if (!roomCode) {
      return
    }

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(roomCode)
      }

      setRoomCodeCopied(true)
    } catch {
      setRoomCodeCopied(false)
    }
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

    if (isRemovingSelf) {
      setOpenBillBreakdowns((currentIds) =>
        currentIds.filter((currentId) => currentId !== billId),
      )
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
    <main className={themeMode === 'dark' ? 'app-shell theme-dark' : 'app-shell'}>
      {step !== 'dashboard' ? (
        <section className="hero-panel">
          <div className="hero-copy">
            <h1>FairySplit</h1>
            <p className="hero-text">Split dorm bills by actual stay time.</p>
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
            <button
              className="drawer-icon-button"
              type="button"
              aria-label="Close room menu"
              onClick={() => setShowRoomMenu(false)}
            >
              <span></span>
              <span></span>
            </button>

            <div className="drawer-header">
              <div>
                <p className="section-label">Rooms</p>
                <h3>Choose a room</h3>
              </div>
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

            <div className="drawer-bottom">
              <button
                className="secondary-button full-width-button"
                type="button"
                onClick={() => {
                  setShowRoomMenu(false)
                  setDraftName(userName || draftName)
                  setStep('room')
                }}
              >
                Add or edit room
              </button>

              <div className="drawer-toggle-row">
                <div>
                  <p className="section-label">Theme</p>
                  <h3>Dark mode</h3>
                </div>
                <button
                  className={themeMode === 'dark' ? 'theme-switch active' : 'theme-switch'}
                  type="button"
                  aria-label="Toggle dark mode"
                  aria-pressed={themeMode === 'dark'}
                  onClick={() =>
                    setThemeMode((currentMode) =>
                      currentMode === 'dark' ? 'light' : 'dark',
                    )
                  }
                >
                  <span className="theme-switch-thumb"></span>
                </button>
              </div>
            </div>
          </aside>
        </>
      )}

      {step === 'room' && (
        <section className="screen-card">
          <div className="screen-heading">
            <h2>Choose a room</h2>
            <p>Set your display name for this room, then create a room or join with a code.</p>
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

            <label className="field">
              <span>Display name</span>
              <input
                type="text"
                placeholder="Example: Phoebe"
                value={draftName}
                onChange={(event) => setDraftName(event.target.value)}
              />
            </label>

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

            <button className="primary-button" type="submit">
              Open room dashboard
            </button>
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
                  <button
                    className={roomCodeCopied ? 'room-code-chip copied' : 'room-code-chip'}
                    type="button"
                    aria-label={`Copy room code ${roomCode}`}
                    onClick={handleCopyRoomCode}
                  >
                    <span className="room-code-value">
                      {roomCode || 'Code not set'}
                    </span>
                    <span className="room-code-hint">
                      {roomCodeCopied ? 'Copied' : 'Tap to copy'}
                    </span>
                  </button>
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
                  <p className="accordion-copy">
                    Tap dates to log or unlog them.
                  </p>
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
                <form className="correction-stack reveal-panel" onSubmit={handleCorrectionSave}>
                  <div className="calendar-card manual-calendar-card">
                    <div className="calendar-header manual-calendar-header">
                      <div>
                        <strong>Manual dates</strong>
                        <p>Empty dates log a stay. Logged dates unlog it.</p>
                      </div>

                      <button
                        className="primary-button calendar-save-button"
                        type="submit"
                        disabled={!hasSelectedCorrections && !hasSelectedRemovals}
                      >
                        Save changes
                      </button>
                    </div>

                    {selectedCorrectionCards.length > 0 ? (
                      <div className="selected-editor-scroll-shell">
                        <div className="selected-editor-grid">
                          {selectedCorrectionCards.map(({ dateKey, draft }) => (
                            <article className="editor-card selected-editor-card" key={dateKey}>
                              <div className="selected-editor-head">
                                <div>
                                  <h3>{formatDateLabel(dateKey)}</h3>
                                </div>
                              </div>

                              <div className="editor-mode-row">
                                <button
                                  className={
                                    draft.mode === 'full-day'
                                      ? 'mode-chip active'
                                      : 'mode-chip'
                                  }
                                  type="button"
                                  onClick={() =>
                                    handleCorrectionDraftModeChange(dateKey, 'full-day')
                                  }
                                >
                                  24h
                                </button>
                                <button
                                  className={
                                    draft.mode === 'range'
                                      ? 'mode-chip active'
                                      : 'mode-chip'
                                  }
                                  type="button"
                                  onClick={() =>
                                    handleCorrectionDraftModeChange(dateKey, 'range')
                                  }
                                >
                                  Time in/out
                                </button>
                                <button
                                  className={
                                    draft.mode === 'hours'
                                      ? 'mode-chip active'
                                      : 'mode-chip'
                                  }
                                  type="button"
                                  onClick={() =>
                                    handleCorrectionDraftModeChange(dateKey, 'hours')
                                  }
                                >
                                  Hours
                                </button>
                              </div>

                              {draft.mode === 'range' ? (
                                <div className="selected-editor-fields">
                                  <label className="field compact-field">
                                    <span>Time in</span>
                                    <input
                                      type="time"
                                      value={draft.startTime}
                                      onChange={(event) =>
                                        handleCorrectionDraftChange(
                                          dateKey,
                                          'startTime',
                                          event.target.value,
                                        )
                                      }
                                    />
                                  </label>

                                  <label className="field compact-field">
                                    <span>Time out</span>
                                    <input
                                      type="time"
                                      value={draft.endTime}
                                      onChange={(event) =>
                                        handleCorrectionDraftChange(
                                          dateKey,
                                          'endTime',
                                          event.target.value,
                                        )
                                      }
                                    />
                                  </label>
                                </div>
                              ) : null}

                              {draft.mode === 'hours' ? (
                                <label className="field compact-field">
                                  <span>Hours stayed</span>
                                  <input
                                    type="number"
                                    min="0.5"
                                    max="24"
                                    step="0.5"
                                    value={draft.hours}
                                    onChange={(event) =>
                                      handleCorrectionDraftChange(
                                        dateKey,
                                        'hours',
                                        event.target.value,
                                      )
                                    }
                                  />
                                </label>
                              ) : null}
                            </article>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    {selectedRemovalCards.length > 0 ? (
                      <div className="editor-card removal-card">
                        <div className="selected-editor-head">
                          <div>
                            <p className="section-label">Will unlog</p>
                            <h3>{selectedRemovalCards.length} day(s)</h3>
                          </div>
                          <span className="selected-editor-note">Tap save to remove</span>
                        </div>

                        <div className="selected-date-list">
                          {selectedRemovalCards.map((dateKey) => (
                            <span className="selected-date-chip remove-chip" key={dateKey}>
                              {formatDateLabel(dateKey)}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    {correctionError ? (
                      <p className="error-text">{correctionError}</p>
                    ) : null}

                    <div className="calendar-scroll-shell">
                      {calendarMonths.map((month) => (
                        <section className="calendar-month-section" key={month.monthKey}>
                          <div className="calendar-month-header">
                            <strong>{month.title}</strong>
                          </div>

                          <div className="calendar-weekdays">
                            {weekdayLabels.map((dayLabel) => (
                              <span className="weekday-chip" key={`${month.monthKey}-${dayLabel}`}>
                                {dayLabel}
                              </span>
                            ))}
                          </div>

                          <div className="calendar-grid">
                            {month.days.map((day) => (
                              <button
                                className={
                                  day.isInCurrentMonth
                                    ? `calendar-day${day.hasRecorded ? ' recorded' : ''}${
                                        day.isSelected ? ' selected' : ''
                                      }${day.isMarkedForRemoval ? ' remove-marked' : ''}${
                                        day.isToday ? ' today' : ''
                                      }`
                                    : 'calendar-day muted'
                                }
                                disabled={!day.isInCurrentMonth}
                                key={day.dateKey}
                                type="button"
                                onClick={() => handleSelectCorrectionDate(day.dateKey)}
                              >
                                <span className="calendar-day-number">{day.dayNumber}</span>
                              </button>
                            ))}
                          </div>
                        </section>
                      ))}
                    </div>
                  </div>
                </form>
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
                          <h4>{billCard.name}</h4>
                        </div>
                        <span className="bill-pill">
                          {billCard.memberCount} sharing
                        </span>
                      </div>

                      <div className="bill-card-values">
                        <span>Total bill</span>
                        <div className="bill-total-copy">
                          <strong>{currencyFormatter.format(billCard.total)}</strong>
                          <span className="bill-date-text">
                            {billCard.periodLabel}
                          </span>
                        </div>
                      </div>

                      {billCard.viewerJoined ? (
                        <div className="bill-card-values">
                          <span>Your share</span>
                          <div className="bill-share-stack">
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
                        </div>
                      ) : (
                        <div className="bill-share-cta solo">
                          <span className="bill-join-note">
                            Join to see your share
                          </span>
                          <button
                            className="primary-button bill-join-button"
                            type="button"
                            onClick={() =>
                              handleToggleBillMember(billCard.id, displayName)
                            }
                          >
                            Join
                          </button>
                        </div>
                      )}

                      {billCard.viewerJoined ? (
                        <>
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
                        </>
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
