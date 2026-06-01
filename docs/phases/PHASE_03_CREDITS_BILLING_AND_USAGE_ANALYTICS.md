<!--
Melotech take-home implementation documentation.
Prepared as a deterministic planning package for a senior developer.
Code blocks are intentionally avoided except for short structural references where clarity requires it.
-->

# Phase 03 — Credits, Billing Ledger, and Usage Analytics


## Objective

Implement an enterprise-style internal credit system that users cannot manipulate from the frontend.

## Core rule

Credits are consumed only when a platform output is successful. Failed platform outputs consume zero credits.

The system must still reserve the maximum possible cost before processing starts to prevent overspending and race conditions.

## Sub-phase 03.1 — Platform credit pricing

### Implement

- Create `packages/billing`.
- Define server-side platform credit costs:
  - Spotify costs 1 credit.
  - TikTok costs 2 credits.
  - YouTube costs 3 credits.
- Create a function to calculate total reservation cost from selected platforms.
- Do not accept credit costs from the frontend.

### Tests immediately after this sub-phase

- Spotify returns 1.
- TikTok returns 2.
- YouTube returns 3.
- All three platforms return total cost 6.
- Duplicate platforms are not allowed before pricing.
- Unsupported platform cannot be priced.

### Acceptance criteria

- Pricing is controlled entirely by the server.

## Sub-phase 03.2 — Wallet and ledger schema

### Implement

- Add `CreditWallet` with `availableCredits` and `reservedCredits`.
- Add `CreditLedgerEntry` as an immutable audit table.
- Add `CreditReservation` linked to a generation request.
- Add ledger entry types: grant, reservation hold, platform capture, reservation release, adjustment.
- Add reservation statuses: active, captured, partially captured, released, cancelled.
- Add idempotency key to ledger entries and make it unique.
- Add user relation to wallet, ledger, and reservation.

### Tests immediately after this sub-phase

- Create wallet for user.
- Prevent more than one wallet per user.
- Create ledger entry with unique idempotency key.
- Reject duplicate idempotency key.
- Create credit reservation linked to generation.

### Acceptance criteria

- The database can audit every credit movement.

## Sub-phase 03.3 — Credit service

### Implement

Create a `CreditService` with methods for:

- Creating wallet for user.
- Granting credits.
- Reserving credits for generation.
- Capturing credits for a successful platform output.
- Releasing unused reserved credits.
- Reading wallet balance.
- Reading ledger history.
- Reading usage analytics.

All balance-changing methods must run in database transactions.

### Tests immediately after this sub-phase

- Creating a wallet initializes available and reserved credits correctly.
- Granting credits increases available credits.
- Granting credits creates a grant ledger entry.
- Reservation moves credits from available to reserved.
- Reservation fails if available credits are insufficient.
- Platform capture decreases reserved credits.
- Platform capture creates a capture ledger entry.
- Release moves unused credits from reserved back to available.
- Duplicate capture idempotency key does not double charge.
- Duplicate release idempotency key does not double release.

### Acceptance criteria

- Credit state cannot be corrupted by repeated worker execution.

## Sub-phase 03.4 — Signup wallet creation

### Implement

- Ensure every new user has a wallet.
- Initial balance decision: give new users 100 credits for demo usability.
- Still keep the “Add 100 credits” button for testing.
- If automatic wallet creation hooks are inconvenient, use an `ensureWalletForUser` service when the authenticated dashboard loads or when the user first creates a generation.

### Tests immediately after this sub-phase

- New user receives a wallet.
- Wallet creation is idempotent.
- Calling ensure wallet twice does not create duplicates.

### Acceptance criteria

- Authenticated users always have a wallet before they can generate content.

## Sub-phase 03.5 — Credit usage analytics repository

### Implement

- Add a repository method that groups consumed credits by daily, weekly, and monthly timeframe.
- Count only platform capture ledger entries.
- Do not count grants, holds, releases, or adjustments as consumption.
- Use userId in every query.
- Use database-side date grouping where practical.

### Tests immediately after this sub-phase

- Daily usage groups captures by day.
- Weekly usage groups captures by week.
- Monthly usage groups captures by month.
- Grants are excluded.
- Reservation holds are excluded.
- Releases are excluded.
- User A analytics do not include User B entries.

### Acceptance criteria

- Usage charts reflect actual consumed credits only.

## Sub-phase 03.6 — Credit security rules

### Implement

Document and enforce these rules:

- The frontend never submits credit amount.
- The frontend never submits platform price.
- The frontend never submits wallet balance.
- The worker captures credits only after successful output storage.
- Failed outputs are never captured.
- Every mutation uses idempotency.
- Ledger entries are immutable.
- Corrections are represented as adjustment ledger entries.

### Tests immediately after this sub-phase

- API payloads containing fake credit amounts are ignored or rejected.
- A failed platform output is not captured.
- Re-processing the same completed platform output does not capture credits twice.

### Acceptance criteria

- The credit system behaves like an internal financial ledger.
