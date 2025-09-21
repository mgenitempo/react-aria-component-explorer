# React Aria: Component ↔ Subcomponent Explorer

A small React app (Vite + React + D3) that visualizes how **React Aria** subcomponents are shared across main components.

- **Interactive grid** of main components (keyboard accessible).
- **Popover** shows subcomponents for the selected main component.
  - Each subcomponent chip links to the **closest React Aria docs page**.
  - A circular **Pippin** background button with a **Cobalt** icon reveals the **“used by”** list.
  - Each chip includes a tiny **“opens in a new tab”** icon with that hover text.
- **D3 bar chart** of **shared subcomponents (2+ parents)**. Clicking a bar shows all main components using that subcomponent.
- **Theme toggle** with **Light/Dark** text and **sun/moon** icon (flip animation, saved to `localStorage`, respects `prefers-color-scheme`).

## Colors
- **Cobalt** `#0047AA`
- **Dew Drop** `#E4F7FF`
- **Pippin** `#FFDFDF`
- **French Blue** `#BEE4FF`
- **Midnight** `#001D44`
- **Polar** `#F4F9FD`

Custom components — share a unified background highlight.

## Setup

### 1. Requirements
- Node.js 18+ (or 20+) and npm

### 2. Install
```bash
npm install
```

### 3. Run in development
```bash
npm run dev
```
This starts Vite and prints a local URL (e.g., http://localhost:5173). Open it in your browser.

### 4. Build for production
```bash
npm run build
npm run preview
```
This compiles the app into `dist/` and serves a preview.

## Data source
We ship a pre-built JSON from an excel spreadsheet:
- `public/data/components.json` — maps `mainToSub` and `subToMains`.
- `public/data/custom-components.json` — set of custom main components.

At runtime the app will **first** try to load the JSON files above. If unavailable, it will **fallback** to parsing the Excel (client-side) using **SheetJS**:
- `public/ReactAriaComponentBreakdown.xlsx`


## Keyboard & A11y
- Native elements with clear labels.
- Strong focus outlines.
- Popover is ESC-closeable and returns focus.
- Minimum 44×44 touch targets.
- Works at 320px width without horizontal scroll.

## File structure

```
react-aria-component-explorer/
├─ index.html
├─ package.json
├─ vite.config.js
├─ public/
│  ├─ data/
│  │  ├─ components.json
│  │  └─ custom-components.json
│  └─ ReactAriaComponentBreakdown.xlsx
└─ src/
   ├─ main.jsx
   ├─ App.jsx
   ├─ styles.css
   ├─ icons.js
   └─ components/
      ├─ Chart.jsx
      ├─ ComponentGrid.jsx
      └─ Popover.jsx
```

## Docs link logic
We link to `https://react-spectrum.adobe.com/react-aria/{{Page}}.html` where **Page** is determined as:
- If a subcomponent **is a main** (has its own column in the sheet), use that page.
- Otherwise, use the **current main** (if it uses the subcomponent), or else the **first** main found that uses it.

---

Built with ❤️ using Vite + React + D3.