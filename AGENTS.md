# Repository Guidelines

## Project Structure & Module Organization

This repository is a dependency-free static site for a knee rehab session tracker.

- `index.html` contains the page structure, rehab content, checklist markup, and script/style links.
- `styles.css` contains layout, responsive behavior, color variables, and component styling.
- `script.js` handles date display, checklist progress, reset actions, notes, and `localStorage` persistence.
- `assets/` is reserved for future images or icons.
- `README.md`, `netlify.toml`, and `vercel.json` document and configure static deployment.
- `implementation-plan.md` and `task-checklist.md` capture project requirements and completed work.

## Build, Test, and Development Commands

There is no package manager, bundler, or backend.

```bash
python3 -m http.server 8000
```

Serves the site locally at `http://localhost:8000/`.

```bash
curl -I http://localhost:8000/
```

Checks that the local static server responds.

Deployment is static: Netlify publishes `.`, and Vercel uses the `Other` preset with output directory `.`.

## Coding Style & Naming Conventions

Use 2-space indentation in HTML, CSS, and JavaScript. Keep the app vanilla unless requirements change.

Prefer semantic HTML (`header`, `main`, `section`, `article`, `label`) and keep every checkbox paired with a visible label. Use CSS variables in `:root` for shared colors and spacing. In JavaScript, use `camelCase` for functions and variables, `UPPER_SNAKE_CASE` for constants, and stable checkbox IDs like `wall-setup`.

## Testing Guidelines

No automated test suite exists yet. For changes, run the local server and verify:

- all 14 checklist items render and toggle;
- progress updates from `0 / 14` through `14 / 14`;
- checklist state, notes, and last-updated values persist after refresh;
- reset clears only checklist state, while clear notes removes only notes;
- mobile widths do not introduce horizontal scrolling.

Check the browser console for JavaScript errors before submitting UI changes.

## Commit & Pull Request Guidelines

This checkout does not expose readable Git history, so use concise imperative commit messages, for example `Add checklist persistence` or `Update deployment headers`.

Pull requests should include a short summary, testing notes, and screenshots for visible UI changes. For medical-content changes, state the source and avoid adding diagnosis or automated medical advice.

## Security & Configuration Tips

Keep the site static and client-only. Do not commit personal rehab notes, user data, or secrets. Preserve the security headers in `netlify.toml` and `vercel.json` unless deployment requires a change.
