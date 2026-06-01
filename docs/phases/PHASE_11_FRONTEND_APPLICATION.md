<!--
Melotech take-home implementation documentation.
Prepared as a deterministic planning package for a senior developer.
Code blocks are intentionally avoided except for short structural references where clarity requires it.
-->

# Phase 11 — Frontend Application


## Objective

Build the user-facing application with auth, generation, history, credits, usage analytics, and Melotech-aligned design.

## Sub-phase 11.1 — App shell and navigation

### Implement

- Create authenticated dashboard layout.
- Add top navigation with product name, generation page link, usage page link, credits balance, and user menu.
- Use the design language tokens from `04_DESIGN_LANGUAGE.md`.
- Unauthenticated users should see login/signup entry points.

### Tests immediately after this sub-phase

- Authenticated layout renders navigation.
- User menu renders current user.
- Credits balance placeholder renders.
- Unauthenticated state does not show dashboard navigation.

### Acceptance criteria

- The app feels like a coherent Melotech internal tool.

## Sub-phase 11.2 — Login and signup pages

### Implement

- Create login page.
- Create signup page.
- Signup fields: name, email, password.
- Login fields: email, password.
- Show validation errors.
- Redirect authenticated users to dashboard.
- Add sign out behavior.

### Tests immediately after this sub-phase

- Login form renders.
- Signup form renders.
- Login submits credentials.
- Signup submits credentials.
- Validation errors display.
- Sign out triggers auth sign out.

### Acceptance criteria

- A user can create an account and access the dashboard.

## Sub-phase 11.3 — Generation form

### Implement

- Prompt input.
- Platform multi-select.
- Region input/select.
- Age range select.
- Gender select.
- Credit cost preview based on selected platforms.
- Generate button.
- Show insufficient credits errors.
- Show rate limit errors.

### Tests immediately after this sub-phase

- Form requires prompt.
- Form requires at least one platform.
- Audience fields are optional.
- Selected platforms update cost preview.
- Submit sends prompt, platforms, and audience only.
- Submit does not send credit costs.

### Acceptance criteria

- User can submit an audience-targeted generation request.

## Sub-phase 11.4 — Active generation view

### Implement

- After request creation, navigate to or display generation detail.
- Show generation status.
- Show prompt and audience chips.
- Show one platform output card per selected platform.
- Side-by-side layout on desktop.
- Stacked cards on mobile.
- Each card supports pending, processing, completed, failed, and cache fallback states.

### Tests immediately after this sub-phase

- Pending state renders.
- Processing state renders.
- Spotify completed output renders.
- TikTok completed output renders.
- YouTube completed output renders.
- Failed state renders.
- Cache badge renders when source is cache.

### Acceptance criteria

- Platform comparison requirement is clearly satisfied.

## Sub-phase 11.5 — Generation history

### Implement

- Add history section or page.
- Show latest generations first.
- Add platform filter.
- Show prompt preview, status, platforms, audience metadata, created time, and consumed credits if available.
- Clicking an item opens generation detail.

### Tests immediately after this sub-phase

- History renders items.
- Platform filter triggers filtered API request.
- Status appears correctly.
- Audience metadata appears when available.
- Clicking item opens detail.

### Acceptance criteria

- User can review previous generations.

## Sub-phase 11.6 — Usage page

### Implement

- Add `/usage` route.
- Show available credits.
- Show reserved credits.
- Add “Add 100 credits” button.
- Show usage history table.
- Show chart of consumed credits.
- Add timeframe selector: daily, weekly, monthly.
- Default timeframe is daily.
- Chart counts consumed credits only.

### Tests immediately after this sub-phase

- Usage page renders wallet balance.
- Add 100 credits button calls grant endpoint.
- Ledger history renders.
- Chart defaults to daily.
- Weekly selector requests weekly data.
- Monthly selector requests monthly data.
- Grants are shown in history but not counted as consumed credits in chart.

### Acceptance criteria

- User understands credit balance and consumption.

## Sub-phase 11.7 — Responsive polish

### Implement

- Verify dashboard, generation detail, history, and usage work on mobile.
- Stack platform cards on mobile.
- Keep prompt input usable on mobile.
- Keep navigation compact.
- Ensure charts fit small screens.

### Tests immediately after this sub-phase

- Component tests for responsive state where practical.
- Manual responsive QA checklist documented in README.

### Acceptance criteria

- Demo works on desktop and mobile widths.
