# Plan: Scratch Card Fix, Gores & Menang Limit, Logo Swap, Welcome Page

## Context
- Scratch card canvas is buggy (DPR double-scaling makes scratching not register, percentage stuck at 0%, threshold too strict)
- Gores & Menang has no limit field — vendors can't set how many prizes are available
- Logo URL needs to swap from Luma CDN to Supabase storage
- A welcome/get-started page is needed so the form isn't the first thing users see

## Decisions Made
- Scratch limit follows the same pattern as the coupon limit (unlimited / set a limit)
- Welcome page: minimal hero + CTA, shown every visit, admin route bypasses it
- No percentage text on scratch card

---

## Task 1: Swap Logo URL

**Files:** `src/App.jsx`, `index.html`

Replace all occurrences of the old Luma CDN URL:
```
https://images.lumacdn.com/cdn-cgi/image/format=auto,fit=cover,dpr=2,anim=false,background=white,quality=75,width=112,height=112/uploads/2k/cdbbdd52-317d-4d85-b02b-2618df9bafae.jpg
```
With the new Supabase storage URL:
```
https://oalebkgsqedfimyjilsf.supabase.co/storage/v1/object/public/vendor-logos/logos/cdbbdd52-317d-4d85-b02b-2618df9bafae.avif
```

- `src/App.jsx`: the `<img>` tag in the header
- `index.html`: the `<link rel="icon">` tag (also change `type="image/jpeg"` to `type="image/avif"`)

---

## Task 2: Fix Scratch Card UX

**File:** `src/components/ScratchCard.jsx`

### Bug: DPR double-scaling
The `initCanvas` function scales the canvas context by DPR (`ctx.scale(dpr, dpr)`) but the `scratch()` function then manually multiplies coordinates by DPR again (`x * dpr`, `y * dpr`). This means on a 2x display, scratching draws at 2x the actual touch position — explaining why it feels like nothing is happening.

**Fix:** Remove the manual DPR multiplication in the `scratch()` function. Since `ctx.scale(dpr, dpr)` is already applied in `initCanvas`, use raw `x, y` coordinates directly in `scratch()`. Also set `ctx.lineWidth = 30` (not `30 * dpr`) since the scale transform handles it.

Alternatively, remove `ctx.scale(dpr, dpr)` from initCanvas and keep the manual DPR math — pick one approach consistently. The simpler fix is to use `ctx.scale` and stop multiplying by DPR in `scratch()`.

### Also in `scratch()`:
- Set `ctx.globalCompositeOperation = 'destination-out'` before every draw call (it may be reset)

### UX improvements:
- Increase brush radius from `15` to `25` for a wider, more satisfying scratch stroke
- Lower `SCRATCH_THRESHOLD` from `0.45` to `0.25` (25% is plenty for a preview scratch card)
- Remove the percentage display. Change the bottom bar to just show "Scratch the gold area above!" while unscratched, and the Reset button after reveal. Remove `scratchPercent` state and `isScratching` state, and the `calcScratchPercent` percentage text.
- Simplify `calcScratchPercent` — just check if enough is scratched, no need to display the number.

### Also fix `calcScratchPercent`:
The function reads `canvas.width` and `canvas.height` which are DPR-scaled, but `getImageData` respects the actual pixel buffer. This is fine, but the sampling step (`i += 16`) should be consistent. Verify the math works after the DPR fix.

---

## Task 3: Add Gores & Menang Limit Field

### 3a. Database migration

**File:** `supabase-schema.sql` — add two new columns at the end of the CREATE TABLE:
```sql
scratch_win_limit_type  text,        -- 'unlimited' | 'limited'
scratch_win_limit_value integer
```

**Provide a separate migration snippet** (to run in Supabase SQL editor for the already-deployed table):
```sql
ALTER TABLE public.vendor_submissions
  ADD COLUMN IF NOT EXISTS scratch_win_limit_type text,
  ADD COLUMN IF NOT EXISTS scratch_win_limit_value integer;
```

### 3b. Form state and UI

**File:** `src/components/VendorForm.jsx`

- Add state: `scratchWinLimitType` (default `'unlimited'`), `scratchWinLimitValue` (default `''`)
- In the Scratch & Win settings section (Step 3), after the prize textarea, add:
  - "Prize Limit" label
  - Same unlimited/set-limit toggle (`options-button-group`) as the coupon limit
  - When "Set Limit" is selected, show a number input for max winners
- Add validation in `validateStep(3)`:
  - If `joinScratchWin && scratchWinLimitType === 'limited'`: require `scratchWinLimitValue` to be a valid positive number
- Add to submission payload:
  - `scratch_win_limit_type: joinScratchWin ? scratchWinLimitType : null`
  - `scratch_win_limit_value: (joinScratchWin && scratchWinLimitType === 'limited') ? parseInt(scratchWinLimitValue) : null`
- Include in the Step 4 success summary
- Reset the two new fields in the "Submit Another" reset handler

### 3c. Admin dashboard

**File:** `src/components/AdminDashboard.jsx`

- In the detail modal's Scratch & Win section, add a "Prize limits" row showing `scratch_win_limit_type` / `scratch_win_limit_value` (same format as coupon limit display)
- Add `scratch_win_limit_type` and `scratch_win_limit_value` to the CSV export headers and row mapping

### 3d. Live preview

**File:** `src/components/LivePreview.jsx`

- Pass `scratchWinLimitType` and `scratchWinLimitValue` props from `VendorForm.jsx`
- Display limit info below the ScratchCard (e.g. "Unlimited Prizes" or "Limit: First X winners")

### 3e. Mock DB

**File:** `src/supabaseClient.js`

- No changes needed — `mockDb.insertSubmission` already spreads all payload fields via `...data`

---

## Task 4: Welcome / Get Started Page

### 4a. New component

**File:** `src/components/WelcomePage.jsx` (new)

Content:
- Wanita Itu logo (Supabase URL, same as header, larger ~80px)
- "WANITA ITU" text branding
- Tagline: "Set up your brand promotions for the upcoming Wanita Itu event"
- "Get Started" button — prominent, uses `btn btn-primary` styling, with framer-motion entrance animation (fade up + scale)
- Clean, centered layout, matching the existing design system (rose/gold/slate theme, same fonts)

### 4b. App.jsx integration

**File:** `src/App.jsx`

- Add `showWelcome` state (default `true`)
- When `!isAdminRoute && showWelcome`, render `<WelcomePage onStart={() => setShowWelcome(false)} />`
- When `!isAdminRoute && !showWelcome`, render existing VendorForm flow (with the Supabase banner if applicable)
- Admin route (`/admin`) always bypasses the welcome page
- The header branding (logo + "WANITA ITU" text) should still appear above the welcome page — or alternatively, move the branding INTO the WelcomePage and hide the header when `showWelcome` is true. Recommend: hide the app header when welcome is shown (the WelcomePage has its own branding), show it once the form starts.

---

## Validation
- Run `npm run build` — must pass with no errors
- Manual test: scratch card should feel responsive on first touch/drag, reveal at ~25% scratch, no percentage shown
- Manual test: Gores & Menang Step 3 shows limit toggle, validation works, payload includes new fields
- Manual test: Welcome page shows on `/`, "Get Started" transitions to form, `/admin` bypasses it
- Manual test: Admin detail modal and CSV export include scratch limit columns

## Migration Note for User
After deploying the code, the user must run the ALTER TABLE migration in Supabase SQL editor to add the two new columns. Without this, scratch limit data won't save. Existing rows will have NULL for the new columns which is fine.
