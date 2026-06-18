# Knee Rehab Session Tracker

A free, static, mobile-friendly knee rehabilitation checklist website.

## Features

- The tracker uses a three-phase protocol: zero-load activation, static wall-supported loading, and supported dynamic control.
- Recovery setup stores pain level, injury history, weekly commitment, and support availability.
- A generated weekly schedule keeps progression conservative when pain, swelling, or support availability is not stable.
- Daily logs record pain before and after, swelling, sharp pain, and the highest completed phase.

## Run locally

```bash
cd rehab-session-site
python3 -m http.server 8000
```

Open: <http://localhost:8000/>

## Free deployment options

### Option A: Netlify Drop — easiest

1. Go to <https://app.netlify.com/drop>.
2. Drag the entire `rehab-session-site` folder into the page.
3. Netlify gives you a free public URL.

### Option B: Netlify from GitHub

1. Push this folder to a GitHub repository.
2. In Netlify, choose **Add new site → Import an existing project**.
3. Select your GitHub repository.
4. If the repository root is `rehab-session-site`, use:
   - Build command: leave empty
   - Publish directory: `.`
5. If the folder is inside a bigger repository, use:
   - Base directory: `rehab-session-site`
   - Build command: leave empty
   - Publish directory: `.`

### Option C: Vercel from GitHub

1. Push this folder to a GitHub repository.
2. In Vercel, choose **Add New → Project**.
3. Import your repository.
4. If the repository root is `rehab-session-site`, keep default settings.
5. If the folder is inside a bigger repository, set:
   - Root Directory: `rehab-session-site`
   - Framework Preset: Other
   - Build Command: leave empty
   - Output Directory: `.`

## Optional Supabase sync

The tracker works locally without Supabase. To sync progress across devices:

1. Create a Supabase project.
2. In Supabase SQL Editor, run the contents of `supabase-schema.sql`.
3. In Supabase, enable Email auth under Authentication.
4. Copy your Project URL and anon public key from Project Settings -> API.
5. Paste them into `index.html`:

```html
window.KNEE_REHAB_SUPABASE_CONFIG = {
  url: "https://YOUR_PROJECT_REF.supabase.co",
  anonKey: "YOUR_SUPABASE_ANON_KEY"
};
```

The anon key is safe to ship in a static site. Privacy comes from Supabase Auth plus the row-level security policies in `supabase-schema.sql`.

For the full integration contract, see [`docs/api.md`](docs/api.md).

## Notes

- No custom backend is required.
- Checklist progress, notes, and local session history are saved in the current browser using `localStorage`; with Supabase configured, authenticated progress also syncs to the cloud.
- The tracker includes a persistent session timer with start, pause, resume, and reset controls stored locally in the browser.
- Wall Sit and Straight Leg Raise include workout-style set rows with per-set timers saved locally in the browser.
- This tracker follows an existing rehab plan and does not replace medical advice.
