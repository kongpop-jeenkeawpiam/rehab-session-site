# Knee Rehab Session Tracker

A free, static, mobile-friendly knee rehabilitation checklist website.

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

## Notes

- No backend is required.
- Checklist progress and notes are saved only in the current browser using `localStorage`.
- The tracker includes a persistent session timer with start, pause, resume, and reset controls stored locally in the browser.
- Wall Sit and Straight Leg Raise include workout-style set rows with per-set timers saved locally in the browser.
- This tracker follows an existing rehab plan and does not replace medical advice.
