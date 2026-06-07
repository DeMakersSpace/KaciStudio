# KACISTUDIO — Handoff Notes

**Date:** 2026-05-24  
**Scope:** Polish pass + code review across all 5 pages

---

## Changes Applied

### `work.html`
**Missing Google Fonts link**  
This was the only page of 5 not loading Cormorant Garamond, causing a font fallback on headings.  
Added preconnect and stylesheet links in `<head>`:
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500;1,600&display=swap">
```

---

### `about.html`
**1. Duplicate CSS declarations in `.manifesto`**  
Three properties (`max-width`, `margin`, `align-items`) were each declared twice in the same rule block. The first occurrence of each was dead code — the second always won. Removed the dead duplicates for clarity.

**2. Missing keyboard focus indicator on `.embed-arrow`**  
The IG/TikTok embed switcher arrows had hover styles but no `:focus-visible` state, making them invisible to keyboard users.  
Added:
```css
.embed-arrow:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}
```

**3. Lazy loading on below-fold images**  
Two co-founder photos in the founders section load eagerly by default. Added `loading="lazy"` to defer them until the user scrolls near.

---

### `index.html` — 2026-06-03 Hero Updates

**1. Hero background image replaced**  
Swapped `media/bgforindexherosection.webp` for the new cover photo:  
`media/For HOME page/Home _ Cover Pic (Polaroid Background).jpg`

**2. Polaroid card images replaced (7 cards)**  
All 7 colour-coded polaroid cards in the hero scatter cluster updated with new images from `media/For HOME page/Home _ Polaroid/`:

| Card label | New image |
|---|---|
| Event · SG | blue.JPG |
| Event · LMM | orange.JPG |
| Event · Wall | purple.JPG |
| Fashion · LMM | yellow.jpg |
| Portrait · 02 | red.JPG |
| Market · In | green.JPG |
| Market · SG | pink.JPG |

**3. Polaroid cluster position**  
`.split-right` set to `justify-content: center` so the polaroid scatter sits centered within the hero image panel.

---

### `index.html`
**1. Missing hover state on `.love-card`**  
Testimonial cards had no interaction feedback on hover — they felt inert.  
Added a subtle border darkening and shadow:
```css
.love-card {
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
}
.love-card:hover {
  border-color: color-mix(in oklch, var(--fg) 30%, transparent);
  box-shadow: 0 4px 24px rgba(88, 71, 56, 0.08);
}
```

**2. Missing vertical separator in stats 2-column layout at 768px**  
At the 900px breakpoint, `border-right: 0` cleared the stat separators. When the grid switches to 2 columns at 768px, the separator was never restored, leaving the stats visually unstructured.  
Added:
```css
@media (max-width: 768px) {
  .stat:nth-child(odd) { border-right: 1px solid var(--rule); }
}
@media (max-width: 430px) {
  .stats { grid-template-columns: 1fr; }
  .stat:nth-child(odd) { border-right: 0; }
}
```

---

### `contact.html`
**Missing keyboard focus indicators on interactive elements**  
Both `.chip` (goal-selection chips) and `.contact-item` (contact method links) had hover styles but no `:focus-visible` states.  
Added to each:
```css
.chip:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}
.contact-item:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}
```

---

## Code Review Findings

### No-action required
`services.html` — `parkAfter()` with a potentially undefined argument was flagged during review. On inspection, a guard (`if (openIdx < 0) return;`) already exists at the call site. No crash risk.

### Low-severity / monitor
`about.html` — The `loading="lazy"` attribute added to the manifesto polaroid *may* defer a visible image on very large desktop viewports (1440px+), which could affect LCP. If Lighthouse flags the manifesto image as LCP, remove `loading="lazy"` from that specific element.

---

## No Changes Made To
- `services.html` — No issues found beyond the already-guarded parkAfter call
- `assets/tokens.css` — No issues
- `assets/chrome.js` — No issues
- `assets/tweaks.js` — No issues

---

## Outstanding (Client to Action)
- All placeholder copy marked `[Client to provide]` still needs real content
- Embed switcher requires live Instagram and TikTok embed codes from the client
- Image assets marked with `placehold.co` URLs need replacing with final photography
