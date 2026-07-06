````md
# FairySplit Project Documentation

## Project Context

`FairySplit` is a shared-expense app for dorms, apartments, or houses where bills should be split based on how long each person actually stayed inside the shared space, not just divided equally.

The main idea is:

- Each room has members.
- Each member logs when they go **In** and **Out**.
- The app turns those logs into stay duration.
- Each bill has its own date range.
- Each person's share is based on their recorded stay time during that bill period.
- Each bill can have its own participants because not every person always shares every bill.

The specific real-life problem it solves is the one you described: instead of manually listing days stayed in the dorm, users should mostly just open the app and tap one button quickly when entering or leaving.

---

# Current Technical State

As of **April 1, 2026**, this repository is currently a **frontend-only prototype**.

### What exists right now

- React + Vite frontend
- Custom CSS styling in `App.css` and `index.css`
- Local/in-memory state only
- No real backend yet
- No MySQL yet
- No Spring Boot yet
- No real authentication yet
- No persistent saving yet

The app already demonstrates the product behavior and UI flow, but it is not yet connected to a real server or database.

---

# Why This Project Makes Sense

This project is not just a bill splitter. It combines:

- Time tracking
- Room/member management
- Bill participation rules
- Date-range-based calculations
- Historical records
- Transparent cost breakdowns

That is exactly why a Java backend will make sense later:

- Strong domain modeling for rooms, bills, members, and stay logs
- Clear validation rules
- Reliable calculation logic
- Good structure for REST APIs
- Good fit for persistence, reporting, and history

---

# Core Business Logic

The main billing rule is:

1. Get each person's total stay duration inside the bill date range.
2. Add all joined members' stay durations.
3. Divide one member's duration by the total duration.
4. Multiply that ratio by the total bill amount.

### Example

- Bill amount = `PHP 6,000`
- You stayed `20 days`
- Person B stayed `15 days`
- Person C stayed `10 days`
- Total = `45 days`

Your share:

```text
20 / 45 × 6000
```

In the current prototype:

- Your stay time is computed from actual session logs.
- Other roommates currently use mock/default sample values.
- Bill participation can differ per bill.

---

# Current Features

## 1. Landing / Room Entry Flow

The app starts at **Choose a room**.

Users can choose between:

- Create room
- Join room

The user enters a display name for that room.

### Create Room

User sets:

- Room name
- Invite code

### Join Room

User enters:

- Room code

After submission, the user goes to the room dashboard.

---

## 2. Room Dashboard

The main room page shows:

- Room name
- Room code
- Main **In/Out** action
- Manual date input
- Bills section
- Recent logs

Additional behaviors:

- Room code is copyable.
- Tapping the room code provides quick copy feedback.

---

## 3. Main Time In / Out System

The most important action in the app is the large **In / Out** button.

If the user is currently outside:

- Button shows **In**
- Tapping it starts a stay session

If the user is currently inside:

- Button shows **Out**
- Tapping it ends the stay session

While active, the button displays:

- When the stay started
- A live running timer

The current live timer only shows elapsed time within the current day, not total accumulated multi-day time.

When inactive, the button shows:

- Last exit time
- Last recorded stay duration

---

## 4. Stay Session Tracking

Every completed stay becomes a session containing:

- Unique ID
- Start datetime
- End datetime
- Source type

Current source types:

- `timer`
- `manual`

Sessions are sorted newest first.

Recent sessions appear in the **Recent Logs** section.

---

## 5. Manual Input of Dates

Manual input is hidden inside an accordion below the main In/Out system.

Purpose:

- Missed logs
- Corrections

Users tap dates on the calendar to add or remove stay records.

The accordion closes automatically after saving.

---

## 6. Scrollable Multi-Month Calendar

The calendar is not limited to one month.

It scrolls across months like a real calendar.

Visible months are based on:

- Current date
- Recorded sessions
- Bill date ranges

This supports overlapping billing periods such as:

`February 7 → March 8`

---

## 7. Calendar Date Behaviors

Empty dates can be selected to add a stay.

Already logged dates can be tapped again to mark them for removal.

Logged days can therefore be unlogged.

Dates visually indicate:

- Recorded
- Selected
- Marked for removal
- Today

---

## 8. Per-Date Manual Editing

Selected add-dates appear in an editor above the calendar.

Each selected date can be edited individually.

Available modes:

- `24h`
- `Time in/out`
- `Hours`

### 24h

Logs a full 24-hour stay.

### Time in/out

User enters:

- Start time
- End time

If the end time is earlier than the start time, it is treated as overnight into the next day.

### Hours

User enters a numeric number of hours stayed.

Validation:

- Time range requires both start and end.
- Hours must be greater than `0` and at most `24`.

---

## 9. Manual Removal of Logged Dates

Logged dates can be marked for removal.

On save:

- Selected dates are subtracted from existing sessions.

If removing only part of a multi-day session, the session is split correctly instead of deleting the entire session.

---

## 10. Selected-Date Editor Container

The selected-date editor is scrollable.

This prevents the manual input section from becoming too tall when many dates are selected, improving usability on smaller screens.

---

## 11. Room Menu / Drawer

The room page includes a hamburger menu that opens a left-side drawer.

The drawer contains:

- Sample room switching
- Add/Edit room shortcut
- Dark mode setting

The drawer closes using a small corner icon.

---

## 12. Room Switching

The drawer contains multiple sample rooms.

Switching updates:

- Room name
- Room code

This is prototype-only behavior and is not backed by a database.

---

## 13. Theme System

Supports:

- Light mode
- Dark mode

The theme toggle is located inside the drawer.

Theme selection is saved in `localStorage`, allowing it to persist after page reload.

---

## 14. Bills Section

Bills are displayed in a horizontal scroll area.

Each bill appears as its own card.

There is always an **Add New Bill** card.

If no bills exist yet, only the add card is displayed.

---

## 15. Create New Bill

Users can create a bill with:

- Bill name
- Total amount
- Start date
- End date

Validation:

- Bill name cannot be empty.
- Amount must be greater than `0`.

The creator is automatically added as a participant.

---

## 16. Edit Existing Bill

Joined users can edit:

- Bill name
- Amount
- Start date
- End date

Non-participants cannot edit the bill.

---

## 17. Per-Bill Participation

Bills are not required to include every room member.

Each bill maintains its own participant list.

Supports situations where:

- One person does not share a certain bill.
- Only selected members participate.

Behavior:

- Creator is automatically included.
- Creator may leave later.
- Non-members can join.
- Members can leave.
- Members can be added or removed in the breakdown section.

---

## 18. Your Share

If the current user has joined:

- Shows **Your Share**
- Displays computed amount
- Shows a **Leave** action

If the current user has not joined:

- Your Share is hidden.
- Displays **Join to see your share**.
- Shows a green **Join** button.

---

## 19. Everyone's Share Breakdown

Joined users can expand **Everyone's Share**.

For every room member, it displays:

- Name
- Whether included in the bill
- Stayed days used for calculation
- Computed share amount (if included)

It also supports:

- Add
- Remove
- Join
- Leave

---

## 20. Bill Share Calculation

Each bill performs its own calculation.

The calculation depends on:

- Bill amount
- Bill date range
- Joined participants

Current user stay duration comes from tracked entries.

Sample roommates currently use placeholder default stay values.

---

## 21. Recent Logs

The bottom section displays recent activity.

It includes:

- Active stay (if running)
- Recent timer sessions
- Recent manual corrections

Each log shows:

- Source type
- Date/time range
- Duration

---

# What Is Still Missing

Planned future features include:

- Spring Boot backend
- MySQL database
- REST API
- Persistent rooms, users, bills, and logs
- Real multi-user synchronization
- Real invite/join system
- Actual authentication
- Monthly recurring bill settings
- Always-on exclusions (e.g., refrigerator logic)
- Bill history saved per month
- Role and permission rules
- True per-user data across devices

---

# Short Version

Right now, **FairySplit** is a polished frontend prototype for a dorm bill-sharing app centered around one habit:

> **Open the app and tap In or Out quickly.**

The prototype already demonstrates:

- Room setup
- Time logging
- Manual correction
- Per-bill participation
- Transparent share computation

The next major milestone is building the backend with persistence using Spring Boot, MySQL, and REST APIs.
