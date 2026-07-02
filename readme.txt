GREEN CUP DASHBOARD - FULL PROJECT README
=========================================

PROJECT PURPOSE
---------------
This project is a full Green Cup Dashboard for IIT Bombay's inter-hostel sustainability competition.

It includes:
- a premium frontend dashboard built with Next.js
- a 3D landing hero
- a public leaderboard
- analytics visualizations
- admin and department data-entry flows
- Supabase authentication
- Supabase database + row-level role-based access
- weekly scoring logic
- hostel master data management
- judging criteria section

The dashboard is designed so that:
- viewers can see public standings and analytics
- PHO can enter waste-related data
- EMD can enter electricity data
- Admin can enter full data and manage hostel-level settings
- new signups must be approved in Supabase before they can actually log in as a department user


==================================================
1. HIGH-LEVEL TECH STACK
==================================================

Frontend:
- Next.js 15 (App Router)
- React 19
- Tailwind CSS + custom CSS in globals.css
- Framer Motion
- Recharts
- Three.js
- @react-three/fiber
- @react-three/drei
- lucide-react

Backend / Data:
- Supabase Auth
- Supabase Postgres
- Supabase Realtime
- Supabase Row Level Security

Project shape:
- frontend = actual working app
- backend = Supabase SQL schema, policies, migrations, seed files


==================================================
2. EXACT PROJECT STRUCTURE
==================================================

/Users/kaushikravuthu/waste-dashboard
|
|-- backend
|   |-- .env
|   |-- README.md
|   |-- package.json
|   `-- supabase
|       |-- schema.sql
|       |-- policies.sql
|       |-- seed.sql
|       |-- role_migration.sql
|       `-- approval_migration.sql
|
|-- frontend
|   |-- .env.example
|   |-- .env.local
|   |-- README.md
|   |-- package.json
|   |-- next.config.mjs
|   |-- middleware.js
|   |
|   |-- app
|   |   |-- globals.css
|   |   |-- layout.jsx
|   |   |-- page.jsx
|   |   |-- auth
|   |   |   `-- page.jsx
|   |   `-- api
|   |       |-- dashboard
|   |       |   `-- route.js
|   |       `-- admin
|   |           |-- submissions
|   |           |   `-- route.js
|   |           `-- hostels
|   |               `-- route.js
|   |
|   |-- components
|   |   |-- admin-panel.jsx
|   |   |-- analytics-panel.jsx
|   |   |-- app-logo.jsx
|   |   |-- BorderGlow.css
|   |   |-- BorderGlow.jsx
|   |   |-- DashboardContent.jsx
|   |   |-- dashboard-shell.jsx
|   |   |-- HeroSection.jsx
|   |   |-- hero-video-card.jsx
|   |   |-- hostel-data-panel.jsx
|   |   |-- judging-criteria.jsx
|   |   |-- leaderboard-panel.jsx
|   |   |-- ModelViewer.jsx
|   |   |-- navbar.jsx
|   |   `-- rank-badge.jsx
|   |
|   |-- lib
|   |   |-- constants.js
|   |   |-- dashboard.js
|   |   |-- demo-data.js
|   |   |-- scoring.js
|   |   `-- utils.js
|   |
|   `-- public
|       |-- earth.mp4
|       |-- favicon.svg
|       |-- home-hero.png
|       |-- icons.svg
|       |-- suscell-logo.png
|       |-- suslogo-real.png
|       |-- suslogo.svg
|       |-- medals
|       |   |-- gold.svg
|       |   |-- silver.svg
|       |   `-- bronze.svg
|       `-- models
|           `-- earth.glb
|
`-- readme.txt


==================================================
3. WHAT THE DASHBOARD CURRENTLY DOES
==================================================

PUBLIC SIDE
-----------
The public homepage contains:
- a full-screen black premium hero section
- SusCell branding in the top-left
- an Earth 3D model on the right
- public dashboard content below the hero

The public dashboard includes:
- Leaderboard tab
- Analytics tab
- Judging Criteria section at the bottom

The public dashboard shows:
- average Green Cup standings (not cumulative raw sum)
- average electricity score
- average waste score
- average events score
- average total score
- badges/medals for the top ranks
- weekly trend charts
- category breakdown charts
- hostel-vs-hostel comparison


DEPARTMENT / ADMIN SIDE
-----------------------
Authenticated roles:
- viewer
- pho
- emd
- admin

Functional permissions:
- viewer: can only view public dashboard
- pho: can submit
  - wasted food in mess
  - mess waste segregation
  - hostel waste
- emd: can submit
  - electricity usage
- admin: can submit everything and also edit hostel population data

There is also an Admin Login page.
Signup does NOT immediately grant department access.
Each signup becomes a pending request until manually approved in Supabase.


==================================================
4. HOW THE APP LOADS
==================================================

Entry file:
/Users/kaushikravuthu/waste-dashboard/frontend/app/page.jsx

This page:
1. calls getDashboardPayload() on the server
2. calls getViewer() on the server
3. passes both into DashboardShell

DashboardShell:
/Users/kaushikravuthu/waste-dashboard/frontend/components/dashboard-shell.jsx

This component:
1. stores the fetched payload in local React state
2. stores the active tab in local React state
3. refreshes dashboard data using /api/dashboard
4. subscribes to Supabase realtime changes on weekly_scores
5. handles logout
6. renders HeroSection
7. renders DashboardContent below hero


==================================================
5. FRONTEND FILE-BY-FILE EXPLANATION
==================================================

APP LAYER
---------

frontend/app/layout.jsx
- root app layout
- loads global styles

frontend/app/globals.css
- main styling file for the whole app
- contains:
  - color variables
  - landing hero styles
  - leaderboard styles
  - chart card styles
  - auth page styles
  - model viewer shell styles
  - judging criteria styles
  - premium shadows / gradients / glass effects

frontend/app/page.jsx
- main homepage
- server-rendered dashboard bootstrap

frontend/app/auth/page.jsx
- login/signup screen
- users select role at signup:
  - PHO
  - EMD
  - Admin
- signup only creates a pending request
- sign-in checks approval from Supabase profiles table


API ROUTES
----------

frontend/app/api/dashboard/route.js
- returns dashboard payload JSON
- this is the main frontend data endpoint

frontend/app/api/admin/submissions/route.js
- POST endpoint for weekly department submissions
- checks if current viewer has admin/department permissions
- then writes/updates weekly_submissions
- then recalculates weekly_scores

frontend/app/api/admin/hostels/route.js
- POST endpoint for hostel master data updates
- admin-only
- updates hostel population


COMPONENTS
----------

frontend/components/dashboard-shell.jsx
- stateful dashboard wrapper
- owns:
  - payload state
  - active tab state
  - realtime refresh behavior
  - logout behavior

frontend/components/HeroSection.jsx
- full-screen landing hero
- left:
  - main headline
  - short tagline
- right:
  - Earth 3D model
- black themed visual layer

frontend/components/navbar.jsx
- top-left branding
- top-right admin login / auth actions

frontend/components/app-logo.jsx
- renders the static SusCell logo/brand block

frontend/components/DashboardContent.jsx
- renders:
  - insight cards
  - tab switcher
  - Leaderboard panel
  - Analytics panel
  - Hostel Data panel
  - Admin panel
  - Judging Criteria section

frontend/components/leaderboard-panel.jsx
- public leaderboard view
- uses payload.leaderboard as single source of truth
- current columns:
  - rank
  - hostel
  - total
  - basket split
  - electricity
  - waste
  - events
- momentum column has been removed from the leaderboard UI
- top 3 use medal badges

frontend/components/rank-badge.jsx
- reusable rank badge
- rank 1 = gold medal
- rank 2 = silver medal
- rank 3 = bronze medal
- rank 4+ = number circle

frontend/components/analytics-panel.jsx
- Recharts visualizations
- weekly movement trend chart
- latest basket contribution chart
- hostel comparison / battle mode

frontend/components/admin-panel.jsx
- department/admin weekly data entry form
- fields shown according to role
- PHO / EMD fields are required for those roles
- admin can submit partial forms

frontend/components/hostel-data-panel.jsx
- admin-only hostel master data manager
- edits number of students in each hostel
- that number gets reused in later calculations

frontend/components/judging-criteria.jsx
- bottom-of-page judging criteria table
- premium styled official scoring explanation section

frontend/components/ModelViewer.jsx
- Three.js / React Three Fiber model viewer
- currently used for:
  - /public/models/earth.glb
- supports:
  - hover rotation
  - drag rotation
  - transparent canvas
  - local GLB loading

frontend/components/BorderGlow.jsx
frontend/components/BorderGlow.css
- integrated React Bits border glow effect
- used to enhance card visuals

frontend/components/hero-video-card.jsx
- older hero/video component retained in codebase
- not the active hero media right now


LIBRARY LOGIC
-------------

frontend/lib/constants.js
- central scoring constants
- defines:
  - score weights
  - placement point arrays
  - segregation point map

frontend/lib/scoring.js
- the main weekly score calculation engine
- takes raw weekly entries
- converts them into weekly category scores
- outputs final weekly_scores rows

frontend/lib/dashboard.js
- biggest logic file in the project
- handles:
  - Supabase vs demo mode
  - viewer role detection
  - payload building
  - weekly score syncing
  - admin submissions
  - hostel data updates
  - aggregation of averages

frontend/lib/demo-data.js
- fallback mock/demo dataset
- used when Supabase env vars are missing

frontend/lib/utils.js
- small helper functions
- formatting helpers, etc.


==================================================
6. BACKEND / DATABASE FILE-BY-FILE EXPLANATION
==================================================

backend/supabase/schema.sql
- main DB schema
- creates:
  - hostels
  - reporting_weeks
  - profiles
  - weekly_submissions
  - weekly_scores
- creates auth trigger for new user -> profile row

backend/supabase/policies.sql
- row-level policies for Supabase

backend/supabase/seed.sql
- initial seed content like hostels and reporting weeks

backend/supabase/role_migration.sql
- migration related to role changes

backend/supabase/approval_migration.sql
- migration adding approval workflow:
  - requested_role
  - approved flag


==================================================
7. DATABASE TABLE STRUCTURE
==================================================

TABLE: hostels
--------------
Stores:
- hostel id
- hostel name
- hostel population
- created_at

Used for:
- public naming
- limiting visible hostels
- student count in calculations


TABLE: reporting_weeks
----------------------
Stores:
- week id
- label
- starts_on
- created_at

Used for:
- grouping weekly entries
- building time-series analytics


TABLE: profiles
---------------
Stores:
- user id (linked to Supabase auth.users)
- email
- role
- requested_role
- approved
- created_at

Role behavior:
- role = active granted role
- requested_role = what user asked for at signup
- approved = whether the user is actually allowed in


TABLE: weekly_submissions
-------------------------
Raw weekly input table.

Stores:
- week_id
- hostel_id
- electricity_kwh
- students_in_hostel
- wasted_food_kg
- hostel_waste_kg
- mess_diners
- segregation_status
- events_count
- orientation_attendance
- notes
- submitted_by
- timestamps

Important:
- this is RAW department/admin input
- scores are not calculated directly from the UI
- scores are generated later into weekly_scores


TABLE: weekly_scores
--------------------
Calculated score table.

Stores:
- week_id
- hostel_id
- rank
- total_score
- electricity_score
- waste_score
- energy_score
- wasted_food_score
- segregation_score
- hostel_waste_score
- events_score
- orientation_score
- electricity_per_student
- wasted_food_per_diner
- momentum_delta
- badges
- created_at

Important:
- leaderboard and analytics mostly use this table
- this table is recalculated after each weekly submission update


==================================================
8. AUTH AND APPROVAL FLOW
==================================================

SIGNUP FLOW
-----------
1. User opens /auth
2. User chooses:
   - PHO
   - EMD
   - Admin
3. Signup writes department_role in auth metadata
4. Supabase trigger creates a profiles row:
   - role = viewer
   - requested_role = selected role
   - approved = false
5. User is signed out immediately

Result:
- signup does NOT grant department access


APPROVAL FLOW
-------------
Admin manually approves in Supabase.

Example:
- user signs up requesting `emd`
- profile becomes:
  - role = viewer
  - requested_role = emd
  - approved = false

Then in Supabase Table Editor or SQL:
- set role = emd
- set approved = true

Only after that:
- sign in works as department user


LOGIN FLOW
----------
At sign-in:
1. app authenticates user with Supabase Auth
2. app fetches profiles row
3. app checks:
   - approved === true
   - role is valid
4. if not approved:
   - app signs the user out
   - blocks access


==================================================
9. WEEKLY DATA ENTRY FLOW
==================================================

PHO can submit:
- wasted food in mess
- mess waste segregation
- hostel waste

EMD can submit:
- electricity usage

Admin can submit:
- everything

Admin also manages:
- hostel population via Hostel Data tab

Submission flow:
1. user fills form in Admin tab
2. form submits to /api/admin/submissions
3. backend merges only the fields the role is allowed to change
4. row is written/upserted in weekly_submissions
5. syncWeeklyScores(weekId) recalculates the week
6. weekly_scores is overwritten for that week
7. dashboard refreshes
8. realtime subscription also refreshes the client


==================================================
10. SCORE CALCULATION LOGIC
==================================================

Scoring is implemented in:
/Users/kaushikravuthu/waste-dashboard/frontend/lib/scoring.js

Constants are defined in:
/Users/kaushikravuthu/waste-dashboard/frontend/lib/constants.js

CURRENT CATEGORY WEIGHTS
------------------------
- Wasted Food in Mess = 20
- Mess Waste Segregation = 15
- Hostel Waste = 10
- Electricity Usage = 30
- Events / ZWDs = 20
- Attendance in Green Cup orientation = 5

Total maximum weekly score = 100


CURRENT FIXED PLACEMENT LOGIC
-----------------------------

WASTED FOOD IN MESS
- 1st = 20
- 2nd = 15
- 3rd = 10
- 4th = 5
- 5th = 0

MESS WASTE SEGREGATION
- 1st = 15
- 2nd = 7.5
- 3rd = 0

HOSTEL WASTE
- 1st = 10
- 2nd = 8
- 3rd = 5
- others = 0

ELECTRICITY USAGE
- 1st = 30
- 2nd = 25
- 3rd = 20
- 4th = 15
- 5th = 10

EVENTS
- 2 or more events = 20
- 1 event = 10
- 0 events = 0

GREEN CUP ORIENTATION ATTENDANCE
- 1st = 5
- 2nd = 3.5
- 3rd = 2.5
- others = 0


CALCULATION DIRECTION
---------------------
- electricity: lower is better
- wasted food: lower is better
- hostel waste: lower is better
- attendance: higher is better


COMBINED BASKETS USED IN UI
---------------------------
UI shows 3 visible divisions:
- Electricity
- Waste
- Events

Internally:
- wasteScore =
  wastedFoodScore + segregationScore + hostelWasteScore

- energyScore =
  eventsScore + orientationScore

But in the UI this combined energyScore is shown as:
- Events


TOTAL SCORE DISPLAY LOGIC
-------------------------
The leaderboard does NOT show cumulative sum across all weeks anymore.

Instead:
- each hostel's displayed total is the average of all entered weeks so far

This keeps total score below 100 over the season.


==================================================
11. LEADERBOARD AGGREGATION LOGIC
==================================================

The public leaderboard is built in:
/Users/kaushikravuthu/waste-dashboard/frontend/lib/dashboard.js

Important current behavior:
- only the first 5 hostels are shown everywhere
- those 5 hostels are selected from hostel list sorted numerically by hostel name
- the app aggregates weekly_scores across all weeks
- displayed leaderboard values are averages:
  - average totalScore
  - average electricityScore
  - average wasteScore
  - average events/energyScore

Leaderboard ordering:
- sort descending by average totalScore

So:
- this is an average standings board
- not cumulative season sum


==================================================
12. ANALYTICS LOGIC
==================================================

Analytics uses:
- all recorded weeks
- all recorded weekly_scores for the visible hostels

It builds:
- weekly movement line chart
- latest basket contribution stacked bar chart
- compare-any-two-hostels battle mode

The analytics tab is driven from the same payload builder as leaderboard, so both tabs use the same main aggregated source.


==================================================
13. DEMO MODE VS PRODUCTION MODE
==================================================

The app can run in 2 modes:

DEMO MODE
---------
If Supabase env vars are missing:
- dashboard uses frontend/lib/demo-data.js

PRODUCTION / REAL MODE
----------------------
If env vars exist:
- dashboard connects to Supabase
- reads actual hostels, weeks, and weekly_scores

This detection is handled in:
/Users/kaushikravuthu/waste-dashboard/frontend/lib/dashboard.js


==================================================
14. ENVIRONMENT VARIABLES
==================================================

Frontend secrets live in:
/Users/kaushikravuthu/waste-dashboard/frontend/.env.local

Required variables:
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY

Do NOT commit real values publicly.


==================================================
15. HOW TO SET UP THIS EXACT PROJECT FROM SCRATCH
==================================================

STEP 1 - CREATE PROJECT
-----------------------
Create a Next.js app with:
- App Router
- Tailwind

Install dependencies:
- next
- react
- react-dom
- @supabase/supabase-js
- @supabase/ssr
- framer-motion
- recharts
- three
- @react-three/fiber
- @react-three/drei
- lucide-react
- clsx
- date-fns


STEP 2 - COPY FILE STRUCTURE
----------------------------
Recreate the exact folders described in section 2.


STEP 3 - COPY FRONTEND FILES
----------------------------
You need all of:
- app/*
- components/*
- lib/*
- public/*
- next.config.mjs
- middleware.js
- package.json


STEP 4 - COPY BACKEND SQL
-------------------------
Create a Supabase project.

Run SQL files in this order:
1. schema.sql
2. policies.sql
3. seed.sql
4. role_migration.sql
5. approval_migration.sql


STEP 5 - ADD ENV VARIABLES
--------------------------
Create:
/Users/kaushikravuthu/waste-dashboard/frontend/.env.local

Fill:
- NEXT_PUBLIC_SUPABASE_URL=...
- NEXT_PUBLIC_SUPABASE_ANON_KEY=...
- SUPABASE_SERVICE_ROLE_KEY=...


STEP 6 - ADD PUBLIC ASSETS
--------------------------
You need these assets copied into public:
- SusCell logo files
- medals
- earth.glb model
- other decorative assets


STEP 7 - RUN THE FRONTEND
-------------------------
From frontend:

npm install
npm run dev


STEP 8 - CREATE USERS
---------------------
Users sign up via /auth.

Then approve them manually in Supabase:
- role = pho / emd / admin
- approved = true


STEP 9 - ENTER DATA
-------------------
1. Admin enters hostel population in Hostel Data
2. PHO enters waste metrics
3. EMD enters electricity
4. Admin can enter everything if needed
5. Dashboard recalculates weekly_scores automatically


==================================================
16. HOW I BUILT THIS DASHBOARD
==================================================

The build process was roughly:

1. Created a Next.js frontend shell
2. Added Supabase schema and weekly score tables
3. Built a public leaderboard and analytics payload generator
4. Added role-based auth with approval workflow
5. Built weekly submission APIs
6. Added scoring logic matching your Green Cup matrix
7. Added premium UI:
   - dark hero
   - cards
   - chart styling
   - leaderboard medals
   - border glow
   - 3D Earth hero
8. Added hostel master data flow
9. Added judging criteria section
10. Adjusted leaderboard to show seasonal average instead of cumulative sum


==================================================
17. WHAT IS CURRENTLY INCLUDED
==================================================

Included now:
- Black premium hero landing page
- SusCell branding
- 3D Earth model
- Public leaderboard
- Analytics tab
- Admin tab
- Hostel Data tab
- Department login/signup flow
- Supabase approval workflow
- Weekly scoring engine
- Realtime refresh
- Judging criteria
- Medal badges
- Border glow cards


==================================================
18. IMPORTANT CURRENT ASSUMPTIONS
==================================================

- Only 5 hostels are displayed in the current UI everywhere
- Leaderboard shows average season score, not cumulative total
- UI shows 3 basket divisions:
  - Electricity
  - Waste
  - Events
- Events UI bucket includes orientation contribution internally
- Signup alone does not grant access
- Approval is manual in Supabase


==================================================
19. KNOWN CAVEATS
==================================================

- The hero Earth look still depends heavily on the quality of earth.glb
- Some older components remain in the codebase even if they are not the active hero path
- Demo mode data may not exactly match production unless explicitly updated
- The app depends on Supabase setup order being correct


==================================================
20. IF YOU WANT TO RECREATE THIS EXACT GREEN CUP LEADERBOARD
==================================================

Use this project as the source of truth.

The minimum required pieces are:
- frontend/app
- frontend/components
- frontend/lib
- frontend/public
- backend/supabase
- frontend/.env.local with valid Supabase keys

If you copy all of that into a new repo and install the same dependencies, then run the same SQL in Supabase, you will recreate this exact project structure and logic.


END OF FILE
