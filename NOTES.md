# Japan Trip Planner — Project Notes

## What's been built

A collaborative, real-time trip planning web app for 8 family members planning a trip to Japan.

### Tech stack
- **Frontend:** React 18 + Vite
- **Styling:** Tailwind CSS
- **Drag & Drop:** @dnd-kit/core + @dnd-kit/sortable
- **Database:** Firebase Firestore (real-time sync)
- **Icons:** lucide-react

### Features
- **Real-time collaboration** — all 8 family members see changes instantly via Firestore's `onSnapshot` listeners
- **Multiple itinerary versions** — create "Option A", "Option B", etc.; rename or delete versions
- **Drag-and-drop scheduling** — drag activity cards between days or reorder within a day; works on both mouse and touch
- **Activity details** — each activity has a title, category, date, start/end time, location, description, and notes
- **8 activity categories** — Sightseeing, Food & Drink, Transport, Shopping, Nature, Culture, Hotel, Other (each with emoji + color)
- **Family member tagging** — tag any activity with one or more of the 8 family members
- **Member filter** — filter the board to show only activities relevant to specific members
- **Persistent settings** — member names, colors, emojis, and trip dates are saved to Firestore
- **Unscheduled column** — activities without a date (or outside the trip range) appear in a separate column
- **Mobile-friendly** — responsive layout, touch drag support, scrollable columns

### File structure
```
src/
  App.jsx                  Main app, DnD context, drag logic
  constants.js             Default family members + activity categories
  firebase.js              Firebase config (connected to japan-trip-planner-d06b2)
  index.css                Tailwind base + scrollbar utilities
  main.jsx                 React entry point
  hooks/
    useVersions.js         Firestore CRUD for itinerary versions
    useActivities.js       Firestore real-time activities per version
    useSettings.js         Firestore sync for member names + trip dates
  components/
    VersionBar.jsx         Version tabs (add / rename / delete)
    DayColumn.jsx          One day column, droppable zone
    ActivityCard.jsx       Draggable activity card
    ActivityModal.jsx      Add/edit activity form
    MemberFilter.jsx       Filter bar by family member
    SettingsModal.jsx      Trip dates + member customization
```

### Firestore data model
```
versions/{versionId}
  name: string
  createdAt: timestamp

versions/{versionId}/activities/{activityId}
  title: string
  category: string
  date: string (YYYY-MM-DD)
  startTime: string
  endTime: string
  location: string
  description: string
  notes: string
  memberIds: string[]
  order: number
  createdAt: timestamp

global/settings
  members: { id, name, color, emoji }[]
  tripDates: { start: string, end: string }
```

## Firebase project
- **Project ID:** `japan-trip-planner-d06b2`
- **Console:** https://console.firebase.google.com/project/japan-trip-planner-d06b2

## Running the app
```bash
npm run dev       # development server → http://localhost:5173
npm run build     # production build → dist/
npm run preview   # preview production build locally
```
