# Locus Copilot

A location intelligence web application for Chennai that scores and ranks business locations based on rent affordability, crowd density, competition, and transit accessibility using weighted multi-criteria analysis.

## Features

- **Multi-criteria scoring** -- Weighted analysis across rent, crowd, competition, and accessibility
- **Interactive map** -- Leaflet.js map with color-coded markers for ranked locations
- **Preset profiles** -- Balanced, Budget, Foot Traffic, Low Competition weight presets
- **Custom weights** -- Adjust sliders per criterion with real-time normalization
- **300+ localities** -- Grid-based cell coverage across Chennai with named locality mapping
- **Business type filtering** -- Medical, Restaurant, Laptop, Mobile, Automobile, Stationary
- **User authentication** -- Register/login with JWT tokens
- **Dashboard** -- Saved searches, preferences, and favorite locations per user
- **Admin panel** -- System statistics and user management
- **Dark/light theme** -- Toggle between light (cream/sage) and dark themes
- **Export results** -- Download analysis as CSV
- **Comparison mode** -- Side-by-side location comparison modal
- **Responsive design** -- Works on desktop and mobile

### AI / ML Features

- **Location Clustering** -- K-Means ML groups 300+ localities into 5 auto-labeled zone profiles (Commercial Hub, Residential, Transit Corridor, Emerging Area, Premium District) with color-coded map overlay
- **Smart Weight Recommendation** -- ML analyzes correlation between business types and location features to auto-suggest optimal slider weights per category
- **Personalized Recommendations** -- Content-based filtering uses your search history and favorites to suggest unvisited locations you'll likely prefer

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Python 3.9+, FastAPI, Uvicorn |
| Frontend | HTML5, CSS3, Vanilla JavaScript |
| Map | Leaflet.js (OpenStreetMap tiles) |
| Auth | PyJWT (JSON Web Tokens) |
| Database | SQLite (users, searches, favorites) |
| Data Processing | Pandas, Shapely, NumPy |
| ML / AI | scikit-learn (K-Means, StandardScaler), NumPy |

## Project Structure

```
Locus_Copilot/
├── backend/
│   ├── main.py              # FastAPI app, all API endpoints
│   ├── scoring_engine.py    # Weighted multi-criteria scoring algorithm
│   ├── ml_engine.py         # ML features (clustering, smart weights, personalization)
│   ├── database.py          # SQLite database (users, searches, favorites)
│   ├── auth.py              # JWT token creation and verification
│   ├── localities.json      # Pre-processed locality data (300+ cells)
│   └── requirements.txt     # Python dependencies
├── frontend/
│   ├── landing.html         # Public landing page
│   ├── login.html           # User login
│   ├── register.html        # User registration
│   ├── index.html           # Main analysis app (map + controls + results)
│   ├── dashboard.html       # User dashboard (searches, preferences, favorites)
│   ├── admin.html           # Admin panel (stats, user management)
│   └── theme.css            # Global design system (light/dark themes)
├── scripts/
│   └── data_processor.py    # Converts raw OSM data into localities.json
├── data/                    # Raw datasets (GeoJSON, CSV)
├── requirements.txt         # Root-level dependencies (same as backend)
└── README.md
```

## Setup and Run (Step-by-Step)

### Prerequisites

- Python 3.9 or higher
- pip (comes with Python)
- A modern web browser
- Internet connection (for map tiles)

### Step 1 -- Clone or open the project

```powershell
cd C:\Users\vikas\Downloads\Locus_Copilot
```

### Step 2 -- Create and activate a virtual environment

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

After activation you should see `(.venv)` at the start of your prompt.

### Step 3 -- Install dependencies

```powershell
pip install -r requirements.txt
```

### Step 4 -- Start the backend server

Open a terminal, activate the venv, then:

```powershell
cd backend
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

You should see:

```
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
INFO:     Started reloader process
```

Leave this terminal running.

### Step 5 -- Start the frontend server

Open a **second** terminal, activate the venv, then:

```powershell
cd frontend
python -m http.server 8080
```

You should see:

```
Serving HTTP on :: port 8080 (http://[::]:8080/) ...
```

Leave this terminal running.

### Step 6 -- Open the app

Open your browser and go to:

```
http://localhost:8080/landing.html
```

## Page Flow

```
landing.html  -->  login.html  -->  index.html (main app)
                   register.html       |
                                  dashboard.html
                                  admin.html (admin only)
```

- **Landing** -- Overview, feature highlights, "Start analyzing" button
- **Login / Register** -- Create an account or sign in (JWT stored in localStorage)
- **Analysis (index.html)** -- Select locality, set weights, run analysis, view map + results
- **Dashboard** -- View saved searches, manage preferences, favorite locations
- **Admin** -- System stats (total users, searches, favorites) and user management table

## Default Admin Account

The database auto-creates an admin user on first run:

```
Email:    admin@locuscopilot.com
Password: admin123
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/localities` | List all 300+ localities |
| POST | `/api/analyze` | Run weighted analysis |
| POST | `/api/auth/login` | Login, returns JWT |
| POST | `/api/auth/register` | Register new user |
| GET | `/api/user/profile` | Get user profile |
| GET | `/api/user/searches` | Get saved searches |
| GET | `/api/user/preferences` | Get saved preferences |
| GET | `/api/user/favorites` | Get/manage favorites |
| GET | `/api/admin/statistics` | Admin: system stats |
| GET | `/api/admin/users` | Admin: user list |
| POST | `/api/admin/users/{email}/deactivate` | Admin: deactivate user |

## Scoring Algorithm

Each location within the search radius is scored:

```
Score = (w_rent x rent_norm) + (w_crowd x crowd_norm) + (w_comp x comp_norm) + (w_access x access_norm)
```

All values are normalized to 0-1. Weights sum to 1.0. Final score is displayed as 0-100%.

**Preset weight profiles:**

| Profile | Rent | Crowd | Competition | Accessibility |
|---------|------|-------|-------------|---------------|
| Balanced | 25% | 25% | 25% | 25% |
| Budget | 40% | 30% | 10% | 20% |
| Foot Traffic | 20% | 40% | 10% | 30% |
| Low Competition | 30% | 20% | 35% | 15% |

## Data Sources

| Dataset | Format | Source |
|---------|--------|--------|
| Chennai Boundary | GeoJSON | OpenStreetMap |
| Points of Interest | GeoJSON | OSM Overpass API |
| Transit Stops | GeoJSON | OpenStreetMap |
| Rent Data | CSV | Public estimates by locality |

## Design System

The UI uses a warm sage-green and gold accent palette defined in `theme.css`:

- **Light theme** -- Cream backgrounds (#fffcf7, #faf7f2), sage green accents (#5b7f6e), gold highlights (#c49b5c)
- **Dark theme** -- Dark grays (#1c1c1e, #2c2c2e), lighter sage (#7faa96), warm gold (#d4a95e)
- Smooth page transitions between all screens
- Theme preference saved in localStorage

## Troubleshooting

**"API Error" when analyzing:**
- Make sure the backend is running on port 8000
- Check the terminal running uvicorn for error messages

**Map tiles not loading:**
- Requires internet connection (tiles load from OpenStreetMap)
- Serve frontend over http, not file://

**"Unauthorized" errors:**
- Token may have expired -- log out and log back in
- Check that localStorage has a valid `token` key

**Localities dropdown empty:**
- Verify `backend/localities.json` exists and is not empty
- Restart the backend server

**Port already in use:**
- Kill existing processes: `Get-Process -Id (Get-NetTCPConnection -LocalPort 8000).OwningProcess | Stop-Process`
- Or use a different port: `--port 8001`
