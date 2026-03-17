# Critter - Food & Exercise Tracker with Virtual Pets

## Project Overview
A mobile-first web app where users track food and exercise, with virtual pets whose mood/health reflects their tracking habits. Built as a monorepo with React frontend and Express backend.

## Tech Stack
- **Frontend**: React 19, Vite 7, Tailwind CSS 4.2, Framer Motion, Zustand, Lucide icons
- **Backend**: Express 5, better-sqlite3 (SQLite WAL mode), Zod validation
- **Runtime**: Node.js with tsx (TypeScript executor)
- **Barcode scanning**: html5-qrcode
- **Food database**: Open Food Facts API (free, no key needed)
- **Notifications**: ntfy (push notifications)

## Project Structure
```
/client          - React frontend (Vite)
  /src/pages     - HomePage, FoodPage, ExercisePage, HistoryPage, ChecklistPage, SettingsPage, OnboardingPage
  /src/components/pet   - PetSVG, SpeechBubble, LevelUpOverlay
  /src/components/food  - BarcodeScanner
  /src/components       - AchievementToast, WardrobeModal, PetTypePicker, ColorPicker
  /src/stores    - Zustand app store
  /src/lib       - API client, themes (time-of-day + seasonal)
  /src/data      - Static food/exercise databases
  /src/hooks     - useDebounce
/server          - Express backend
  /src/index.ts       - API routes (main entry)
  /src/database.ts    - SQLite schema & migrations
  /src/pet-engine.ts  - Pet stat calculations, XP/leveling formulas
  /src/achievements.ts - Achievement definitions & unlock checks
  /src/accessories.ts  - Wardrobe items & equip logic
  /src/open-food-facts.ts  - Open Food Facts API proxy
  /src/notifications.ts    - ntfy integration & scheduler
  /src/exercise-import.ts  - Health Auto Export webhook handler
  /data           - SQLite database file (gitignored)
```

## Commands
- `npm run dev` - Run server + client concurrently (dev mode)
- `npm run build` - Build client for production (outputs to client/dist/)
- `npm start` - Start server only (serves built client)
- `npm run dev:server` - Server only with watch mode
- `npm run dev:client` - Client dev server only (port 5173)

## Database
- SQLite at `server/data/food-app.db` (auto-created on first run)
- Tables: profiles, pet_stats, food_entries, exercise_entries, settings, blocker_bypasses, streaks, pet_progression, achievements, pet_equipped, checklist_items, checklist_completions
- Schema migrations run automatically on server startup in database.ts
- Column additions use PRAGMA table_info checks before ALTER TABLE

## Key Concepts
- **Tracking modes**: "casual" (just logging = pet happy) vs "structured" (nutrition quality matters)
- **Pet stats**: fullness (decays 2/hr), fitness (decays 1/hr), happiness (derived), interaction_bonus (decays 0.5/hr)
- **Pet moods**: ecstatic, happy, content, meh, sad, sick, starving, sleeping (11PM-7AM)
- **Debuffs**: is_stuffed (fullness > 90), is_exhausted (fitness > 90) — each -15 happiness
- **XP/Leveling**: `level = floor(sqrt(xp / 50)) + 1`. XP earned from food (+10-15), exercise (+15-20), streaks, checklist completions (+8), petting (+2)
- **Treats**: Earned via streak milestones, level-ups, goal completion. Feed to pet for +15 interaction_bonus
- **Achievements**: 16 achievements unlocked by milestones (streaks, meal counts, levels, etc.)
- **Accessories**: 16 wardrobe items (hats, glasses, scarves, necklaces) unlocked by level/streak/achievement
- **Checklists**: User-created tasks (once/daily/weekly recurring) that reward pet on completion
- **Streaks**: Consecutive days of logging food or exercise

## Deployment
- **Server**: 192.168.12.254 (Maggi), path: `C:\Users\server\Desktop\food-app`
- **Service**: NSSM service named `food-app` (auto-start, auto-restart)
- **Domain**: https://food.localmusicoklahoma.store
- **Tunnel**: Cloudflare tunnel → localhost:3003
- **Deploy flow**: `git push` → SSH to server → `git pull && npm run build` → `nssm restart food-app`

## Port
Server runs on port 3003 (configurable via PORT env var)
