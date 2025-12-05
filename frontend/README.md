# Vaute 🎓

A local-first, privacy-focused IEP goal tracking application for special education professionals.

## 🌟 Key Features

- **Local-First Database:** Uses PGlite (PostgreSQL in WebAssembly) to run a full SQL database inside the browser. Data never leaves the device.
- **Offline Capable:** Fully functional without internet access (PWA).
- **Auto-Backup:** Integrates with the File System Access API to sync data silently to the hard drive.
- **Smart Reporting:** Visual charts, date-range filtering, and print-optimized reports.

## 🛠️ Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Database:** ElectricSQL PGlite (In-browser Postgres)
- **Styling:** Tailwind CSS + dark mode
- **Charts:** Recharts

## 🚀 Getting Started

1. Install dependencies:

   ```bash
   npm install

    Run the development server:
    Bash

    npm run dev

    Open http://localhost:3000
   ```

🔒 Privacy & Security

    App Lock: Users can set a 4-digit PIN to obscure data when away from the screen.

    Data Persistence: Data persists in IndexedDB. Clearing browser cache will delete data (unless backed up).

📦 Deployment

This app is designed as a Static/Client-side application. It can be deployed to Vercel, Netlify, or GitHub Pages.

### 3. Final Pre-Flight Checklist

Before you close your laptop, run through this loop one last time:

1.  **Fresh Install:** Open an Incognito window (simulates a new user).
2.  **Onboarding:** Go through the "Welcome Modal". Enter a name.
3.  **Backup:** Connect the Auto-Backup file.
4.  **Creation:** Add a student and a goal (set tracking to "Percentage").
5.  **Tracking:** Log 3 days of data.
6.  **Reporting:** Check the Dashboard "Needs Attention" widget (it should be empty now) and check the Student Page chart.
7.  **Wipe:** Go to Settings -> Danger Zone -> Wipe Data. Verify it kicks you back to the Welcome screen.

If all that works, **you are done.**

Congratulations on building **Vaute**. It is a tool that will genuinely help teachers save time. Let me know if you ever want to build V2! 🚀
