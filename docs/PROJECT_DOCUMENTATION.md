# FairySplit Project Documentation

## Project Overview

**FairySplit** is a web application that helps roommates fairly split shared expenses based on how long each person actually stayed in a shared living space.

Unlike traditional bill-splitting apps that divide expenses equally, FairySplit automatically calculates each person's share using recorded stay durations within a bill's billing period.

The goal is to replace manual tracking with one simple habit:

> **Open the app and tap In when entering, and Out when leaving.**

---

# Problem Statement

People living in dorms, apartments, or shared houses often split utility bills equally even when everyone stays for different lengths of time.

A common workaround is manually counting how many days each person stayed during a billing period. This process is repetitive, time-consuming, and prone to mistakes.

FairySplit solves this problem by allowing users to quickly record when they enter and leave the shared space. The application then automatically computes each member's bill share using their recorded stay duration.

---

# Core Concept

The main workflow is simple:

- Each room contains multiple members.
- Members record when they go **In** and **Out**.
- The app converts those records into stay durations.
- Each bill has its own billing period.
- Bills may include different participants.
- Each participant pays according to the amount of time they stayed during that billing period.

---

# Current Technical State

As of **April 1, 2026**, this repository is a **frontend-only web application prototype**.

## Current Technology

- React
- Vite
- JavaScript
- CSS
- Browser localStorage
- In-memory application state

## Current Limitations

The application currently does **not** include:

- Backend server
- Database
- User accounts
- Authentication
- Persistent cloud storage
- Multi-user synchronization

The prototype focuses on validating the user experience, application flow, and billing logic before introducing backend infrastructure.

---

# Why This Project Exists

FairySplit is more than a bill-splitting application.

It combines several systems into one workflow:

- Time tracking
- Room management
- Member management
- Stay session tracking
- Bill participation
- Date-range calculations
- Historical records
- Transparent bill computation

Together, these features eliminate manual calculations while making bill sharing more accurate and transparent.

---

# Core Business Logic

For every bill:

1. Calculate each participant's total stay duration within the bill period.
2. Add the stay durations of every participating member.
3. Compute each participant's percentage of the total stay duration.
4. Multiply that percentage by the total bill amount.

## Example

- Bill amount = `PHP 6,000`
- You stayed `20 days`
- Person B stayed `15 days`
- Person C stayed `10 days`
- Total stay duration = `45 days`

Your share:

```text
20 / 45 × 6000
```

Current prototype behavior:

- The current user's stay duration is calculated from actual recorded sessions.
- Sample roommates currently use placeholder values.
- Each bill can have different participants.

---

# Current Features

## 1. Landing / Room Entry Flow

The application starts on **Choose a Room**.

Users can:

- Create a room
- Join a room

Each user provides a display name.

### Create Room

Requires:

- Room name
- Invite code

### Join Room

Requires:

- Room code

After submission, the user enters the room dashboard.

---

## 2. Room Dashboard

Displays:

- Room name
- Room code
- Main In/Out button
- Manual stay editor
- Bills
- Recent logs

Additional functionality:

- Copy room code
- Visual copy confirmation

---

## 3. Main In / Out System

The primary interaction is the large **In / Out** button.

If currently outside:

- Button displays **In**
- Starts a stay session

If currently inside:

- Button displays **Out**
- Ends the stay session

During an active session:

- Start time is displayed
- Live timer updates continuously

When inactive:

- Last exit time
- Last recorded stay duration

---

## 4. Stay Session Tracking

Each completed stay stores:

- Unique ID
- Start datetime
- End datetime
- Source type

Current source types:

- `timer`
- `manual`

Sessions are sorted newest first.

---

## 5. Manual Date Input

Manual editing is available through an accordion.

Used for:

- Missed entries
- Corrections

Users can add or remove stay dates.

The accordion automatically closes after saving.

---

## 6. Multi-Month Calendar

The calendar scrolls across multiple months.

Displayed months depend on:

- Current date
- Existing stay sessions
- Bill date ranges

Supports billing periods that span multiple months.

---

## 7. Calendar Date States

Dates visually indicate:

- Recorded stay
- Selected
- Pending removal
- Today

Logged dates can also be unlogged.

---

## 8. Per-Date Manual Editing

Each selected date can use one of three input modes:

### 24 Hours

Records an entire day.

### Time In / Out

Users provide:

- Start time
- End time

Overnight sessions are automatically handled.

### Hours

Users enter a total number of hours.

Validation:

- Both start and end time required
- Hours must be between `0` and `24`

---

## 9. Manual Removal

Removing logged dates subtracts those dates from existing sessions.

Partial removals correctly split multi-day sessions.

---

## 10. Scrollable Date Editor

The manual editor is scrollable to prevent excessive page height when editing multiple dates.

---

## 11. Room Drawer

The navigation drawer includes:

- Sample room switching
- Room management shortcut
- Theme toggle

---

## 12. Room Switching

Users can switch between sample rooms.

Currently updates:

- Room name
- Room code

This is prototype-only functionality.

---

## 13. Theme Support

Supports:

- Light mode
- Dark mode

Theme preference is saved using `localStorage`.

---

## 14. Bills Section

Bills are displayed horizontally.

Features include:

- Bill cards
- Add New Bill card

---

## 15. Create Bill

Users provide:

- Bill name
- Amount
- Start date
- End date

Validation:

- Name required
- Amount greater than zero

Creator automatically joins the bill.

---

## 16. Edit Bill

Participants can edit:

- Name
- Amount
- Billing dates

Non-participants cannot edit.

---

## 17. Bill Participation

Each bill has its own participant list.

Supports:

- Join
- Leave
- Add members
- Remove members

Different bills may include different members.

---

## 18. Your Share

Participants see:

- Computed share
- Leave button

Non-participants see:

- Join button
- "Join to see your share"

---

## 19. Everyone's Share

Displays:

- Member name
- Participation status
- Stay duration used
- Computed share

Also supports participant management.

---

## 20. Bill Calculation

Every bill computes shares independently using:

- Bill amount
- Billing period
- Joined participants

Current user calculations use actual stay sessions.

Sample roommates currently use placeholder data.

---

## 21. Recent Logs

Displays:

- Active stay
- Timer sessions
- Manual edits

Each entry includes:

- Source
- Time range
- Duration

---

# Target Production Architecture

The current repository validates the user experience before introducing backend infrastructure.

The long-term goal is to evolve FairySplit into a production-ready full-stack web application.

## Recommended Technology Stack

### Frontend

- React
- TypeScript
- Vite
- React Router
- Tailwind CSS
- TanStack Query

### Backend

- NestJS
- REST API

NestJS provides a scalable backend architecture while allowing both the frontend and backend to share the same language (TypeScript).

### Database

- PostgreSQL

A relational database naturally fits FairySplit because it manages interconnected entities such as:

- Users
- Rooms
- Members
- Stay Logs
- Bills
- Bill Participants

PostgreSQL also provides excellent support for timestamp, date-range, and aggregation queries.

### ORM

- Prisma

Prisma simplifies database access through a type-safe ORM while keeping the data model clean and maintainable.

### Authentication

- Better Auth (or another authentication provider)
- JWT authentication
- Optional Google Sign-In

### Real-Time Communication

- WebSockets

Real-time synchronization enables roommates to immediately see:

- Time In / Out events
- Bill updates
- Participant changes
- Room activity

without refreshing the page.

## Deployment

### Frontend

- Vercel

### Backend

- Railway
- Fly.io
- Render

### Database

- Neon PostgreSQL
- Railway PostgreSQL

This stack prioritizes developer productivity, maintainability, deployment simplicity, and future scalability.

---

# Development Roadmap

## Phase 1 — Backend Foundation

Build the backend application.

Objectives:

- Create REST API
- Connect PostgreSQL
- Define application models
- Implement CRUD operations

Core entities:

- Users
- Rooms
- Room Members
- Stay Logs
- Bills
- Bill Participants

---

## Phase 2 — User Authentication

Implement:

- User registration
- Login
- Secure authentication
- Protected API routes

---

## Phase 3 — Persistent Storage

Replace browser-only state with database persistence.

Persist:

- Users
- Rooms
- Members
- Stay sessions
- Bills
- Bill participants
- User preferences

---

## Phase 4 — Multi-User Collaboration

Implement shared rooms.

Features:

- Invite codes
- Join room
- Shared bills
- Shared stay logs

---

## Phase 5 — Real-Time Synchronization

Enable live updates.

Examples:

- Member times in
- Member times out
- Bill edits
- Participant changes
- Room activity

---

## Phase 6 — Advanced Billing

Potential additions:

- Monthly recurring bills
- Permanent bill exclusions
- Utility categories
- Payment tracking
- Bill history
- Monthly reports

---

## Phase 7 — Quality Improvements

Improve overall product quality.

Examples:

- Push notifications
- Better validation
- Error handling
- Accessibility
- Responsive improvements
- Unit testing
- API testing
- Performance optimization

---

# Long-Term Vision

FairySplit aims to become a lightweight shared-living expense platform that removes the need for manually counting stay durations every billing cycle.

Instead of asking roommates to remember how many days they stayed, the application continuously records stay sessions and automatically computes fair bill shares using transparent, time-based calculations.

The long-term goal is to reduce bill sharing to one simple daily habit:

> **Open the app, tap In when entering, and Out when leaving.**