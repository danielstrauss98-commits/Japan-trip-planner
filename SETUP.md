# Japan Trip Planner — Setup Guide

## 1. Install Node.js

```bash
brew install node
```

Or download from https://nodejs.org (LTS version).

## 2. Install dependencies

```bash
cd ~/Desktop/Japan-trip-planner
npm install
```

## 3. Create a Firebase project

1. Go to https://console.firebase.google.com
2. Click **Add project** → name it "japan-trip-planner" → Continue
3. Disable Google Analytics (optional) → **Create project**
4. In the left sidebar: **Firestore Database** → **Create database**
   - Start in **test mode** (allows all reads/writes while you set up)
   - Choose a region close to Japan (e.g. `asia-northeast1` for Tokyo)
5. Back in project overview: click the **Web** icon (`</>`) to register a web app
   - App nickname: "Japan Trip Planner" → Register
   - Copy the `firebaseConfig` object shown

## 4. Add your Firebase config

Open `src/firebase.js` and replace the placeholder values with your config:

```js
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "japan-trip-planner-xxxxx.firebaseapp.com",
  projectId: "japan-trip-planner-xxxxx",
  storageBucket: "japan-trip-planner-xxxxx.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
}
```

## 5. (Optional) Deploy Firestore security rules

If you want to lock the database to only your app:
```bash
npm install -g firebase-tools
firebase login
firebase init firestore   # choose your project
firebase deploy --only firestore:rules
```

## 6. Start the app

```bash
npm run dev
```

Then open http://localhost:5173 in your browser.

## 7. Share with family

Once working, deploy for free with:
```bash
npm run build
npx firebase-tools deploy --only hosting
```

Or drag the `dist/` folder to Netlify Drop (https://app.netlify.com/drop).

---

## First-time setup in the app

1. Click **Settings** (gear icon) → set your trip start/end dates → enter each family member's name
2. Click **+ New version** to create "Option A"
3. Start adding activities with the **+ Add activity** button under each day
4. Share the URL with all 8 family members — changes sync in real-time!
