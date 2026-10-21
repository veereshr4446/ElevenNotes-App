# ElevenNotes

**Your Student Life, Organized.**

A free, phone-first student planner for RYMEC Ballari, built with plain HTML, CSS and JavaScript. No login and no build step. It can be installed on the phone like an app.

Created by Viresh R. (RYMEC Ballari). The idea, design decisions, timetable data and testing are mine; the code was written with the help of Claude, an AI assistant from Anthropic.

## Features
- **Class picker:** choose your branch and semester. Subjects, timetable and faculty follow your class. Search (top bar) finds subjects, notes, tasks, tools and classes.
- **Home:** a "Today" sheet with your classes (current class marked Now, the next one marked Up next), pending tasks, exam countdown and quick links.
- **Study:** subjects, a day-by-day timetable, and shared notes.
- **Notes:** upload Google Drive links with a typed subject name, shared with your class. Search them, like the useful ones (most liked first), report bad ones. Each upload gets a 6-digit PIN, and only that PIN can delete it.
- **Plan:** tasks with subject, priority and due date.
- **Tools:** SGPA calculator (VTU grade scale), attendance planner, exam countdown with your own dates, focus timer.
- **Profile:** name, USN, bio and picture, day streak and stats, today's goals, pending tasks, and a Settings button (class, dark mode, feedback, install, about, reset).
- **Install as an app:** works offline for the timetable and tasks.
- **Also:** faculty ratings, Events (coming soon), Community link, dark mode.

## Tech
- Front end: plain HTML, CSS and JavaScript (no framework).
- Backend for shared notes: Supabase (PostgreSQL), with the logic written in PL/pgSQL functions.
- Hosting: GitHub Pages / Vercel (static site).
- PWA: `manifest.json` and a service worker (`sw.js`).

## Privacy
- Your tasks, profile, class choice and settings are saved only in your own browser (LocalStorage). They are never sent anywhere.
- Only two things go to the online database (Supabase): notes you choose to share (title, subject, Drive link, the name you type, and a hashed delete PIN), and a random anonymous device ID used for likes and a private daily usage count. No logins, emails or personal data are collected.
- ElevenNotes is not connected to any college system or third-party portal and does not read attendance or marks.
- Timetables are added class by class from the official college timetables. Always check your official college timetable too.

## Setting up the shared Notes (Supabase)
1. Create a free project at supabase.com.
2. Open **SQL Editor** and run these files once, in this order:
   - `supabase/setup.sql` (notes table and functions)
   - `supabase/upvotes.sql` (likes)
   - `supabase/stats.sql` (private usage count)
3. Open **Project Settings > API**, copy the Project URL and the anon / publishable key into `js/config.js`.
4. Commit and push. Done.

How it stays safe: the tables are locked, the website can only call a few approved functions, the PIN is stored only as a bcrypt hash, 5 wrong PINs lock that note for 15 minutes, only Google Drive/Docs links are accepted, and notes with 5 reports are hidden. The usage numbers can only be read by the owner in the Supabase SQL Editor with `select get_stats();`.

## Add a class timetable
Add an entry to `CLASS_DATA` in `js/data.js`, keyed as `BRANCH|SEMESTER` (for example `CSE-A|3`), with its subjects, faculty and timetable.

## Run locally
Open `index.html` in a browser, or use the VS Code Live Server extension.

## Structure
```
index.html            page shell
css/style.css         design system, light and dark themes
js/config.js          Supabase URL and public key
js/data.js            classes, subjects, timetables, faculty
js/app.js             pages, tools, planner, timer, notes, player
manifest.json, sw.js  install as app and offline support
supabase/*.sql        database tables and functions
images/ audio/        logo, icons, avatars, focus music
```

## Disclaimer
ElevenNotes is an independent student project. It is not an official application of any college or institution.

Built with ❤️ by Viresh R.
