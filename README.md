# ElevenNotes

**Your Student Life, Organized.**

A free, phone-first student planner built with plain HTML, CSS and JavaScript. No login, no server, no build step.

Created by Viresh R. (RYMEC Ballari). The idea, design decisions, timetable data and testing are mine; the code was written with the help of Claude, an AI assistant from Anthropic.

## What is inside
- **Class picker**: choose branch (CSE A/B, AI & ML, Data Science, ISE, ECE, EEE, Mechanical, Civil) and semester. Subjects, timetable, faculty, dates and the shared library follow your class. **Search** (top bar) finds subjects, notes, tasks, tools and classes.
- **Home**: a "Today" sheet with your classes, your next class highlighted, tasks, exam countdown and quick links
- **Study**: subjects, a day-by-day timetable, and notes (save Google Drive links per subject)
- **Notes** (Study > Notes): upload Google Drive links with a typed subject name, shared with your class, and search them. Each upload gets a 6-digit PIN, and only that PIN can delete it. Needs the free Supabase setup below.
- **Plan**: tasks with subject, priority and due date
- **Tools**: SGPA calculator (VTU grade scale), attendance planner, exam countdown with your own dates, focus timer
- **Me**: your name, USN, bio and picture, plus XP levels, daily challenges and 13 badges
- **Faculty** ratings, **Events** (coming soon), **Community** link, dark mode

## Privacy
- Everything you enter is saved only in your own browser (LocalStorage). Nothing is sent anywhere.
- ElevenNotes is **not connected to any college system or third-party portal** and does not read attendance or marks.
- Timetables are added class by class (CSE A, Semester 3 so far). Always check your official college timetable too. Add a class in `CLASS_DATA` in `js/data.js`.

## Switching on the Shared library
1. Create a free project at supabase.com.
2. Open **SQL Editor**, paste all of `supabase/setup.sql`, and run it.
3. Open **Project Settings > API**, copy the Project URL and the anon / publishable key into `js/config.js`.
4. Commit and push. Done.

How it stays safe: the table is locked, the website can only call four functions, the PIN is stored only as a bcrypt hash, 5 wrong PINs lock that link for 15 minutes, only Google Drive/Docs links are accepted, and links with 5 reports are hidden. You can remove anything yourself in the Supabase Table Editor.

## Run locally
Open `index.html` in a browser, or use the VS Code Live Server extension.

## Structure
```
index.html          page shell
css/style.css       design system, light and dark themes
js/config.js        Supabase URL and key for the Shared library
supabase/setup.sql  database tables and functions
js/data.js          sample subjects, timetable, badges, challenges
js/app.js           pages, tools, planner, timer, progress system
images/ audio/      logo, avatars, focus music
```

## Disclaimer
ElevenNotes is an independent student project. It is not an official application of any college or institution.

Built with ❤️ by Viresh R.

## Upvotes and install

- **Upvotes:** run `supabase/upvotes.sql` once in the Supabase SQL Editor (after `setup.sql`). Notes then show a heart (like) button, one vote per device, and the most liked notes come first. Until you run it, everything else works and the button is hidden.
- **Install as an app:** `manifest.json`, `sw.js` and the icons in `images/` make ElevenNotes installable (Settings > Install app). It opens full screen and works offline for your timetable and tasks.
