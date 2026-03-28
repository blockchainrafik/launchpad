# 📋 New GitHub Issues — Soroban Token Launchpad (Wave 2)

These issues extend the existing 16 issues in `PENDING_ISSUES.md` and are numbered 17–29 to continue the sequence. They fill gaps in testing, CI/CD, indexer integration, contract security, accessibility, and growth features identified from the PRD and the current codebase.

Complexity levels match the Stellar Wave Program on Drips:

- 🟢 **Trivial** (100 pts) — Small, well-defined, great for first-timers
- 🟡 **Medium** (150 pts) — Standard features or involved bug fixes
- 🔴 **High** (200 pts) — Complex features, integrations, or refactors

---k

## ⚠️ Parallelism & Conflict Guide

Use this table when assigning issues to different contributors simultaneously.

| Zone                   | Issues        | Shared Files / Risk                                                                                                                      | Recommendation                                                                     |
| ---------------------- | ------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| ✅ **Contracts**       | #17, #20, #24 | Each touches different contract files / CI config — no overlap                                                                           | Safe to assign all 3 in parallel                                                   |
| ✅ **New files only**  | #19, #21, #29 | Each creates brand-new files (E2E tests, `lib/indexer.ts`, `PersonalDashboard` list)                                                     | Safe in parallel                                                                   |
| ⚠️ **Deploy flow**     | #18, #25, #28 | All modify `DeployForm.tsx` or deploy step components                                                                                    | Assign **sequentially** (pick any order) or assign to same person                  |
| ⚠️ **Token dashboard** | #22, #23      | Both add new data/hooks wired into `TokenDashboard.tsx`                                                                                  | Assign sequentially or to same person                                              |
| ✅ **Standalone**      | #26, #27      | A11y audit produces a report + CSS fixes; i18n extracts strings into `messages/`. Minimal overlap if i18n goes **after** a11y fixes land | Safe in parallel if #27 is based on post-#26 branch, otherwise assign sequentially |

**TL;DR — you can safely assign all 13 issues across 8+ contributors with only two sequencing constraints:**

1. **Deploy flow group** (#18 → #25 → #28) — merge one before starting the next
2. **Dashboard group** (#22 → #23) — merge #22 before #23

Everything else is fully independent.

---

## Phase 5: Testing & CI 🧪

_Harden the project with automated quality gates and cross-browser confidence._

### 17. Automated Contract Size & Gas Report on PRs

🟡 **Medium** · `devex` `ci` `contracts`

**Issue:** Contributors have no visibility into how their changes affect compiled WASM size or execution costs. A seemingly small Rust change could bloat the contract past Soroban's size limits.
**Fix:** Extend the existing `.github/workflows/ci.yml` contracts job to run `wasm-opt --print-size` (or `ls -lh`) on the compiled WASM output and post the result as a PR comment via `actions/github-script`. Optionally compare against the `master` baseline and flag regressions above a configurable threshold (e.g., +5 KB).

### 18. Testnet Faucet Integration in the Deploy Flow

🟡 **Medium** · `frontend` `ux` `devex`

**Issue:** First-time users on testnet hit the deploy flow and immediately fail because their wallet has no XLM to pay for the transaction. They have to leave the app, find Friendbot, fund the account, and come back.
**Fix:** On the deploy review step, detect when the connected wallet's testnet balance is below a minimum threshold (e.g., 100 XLM). If so, show a prominent banner with a one-click "Fund with Friendbot" button that calls `https://friendbot.stellar.org/?addr={pubkey}` and refreshes the balance. Disable the button on mainnet.

### 19. End-to-End Wallet Connect & Deploy Smoke Test

🔴 **High** · `frontend` `testing` `e2e`

**Issue:** The critical user path — connect wallet → fill form → deploy token — is only tested manually, making regressions easy to miss.
**Fix:** Add Playwright or Cypress with a mock Freighter provider that stubs `window.freighterApi`. Write a single E2E test covering: page load → wallet connection → form fill → pre-flight check → simulated deploy confirmation. Document how to run locally and in CI.

### 20. Vesting Contract Integration Tests

🟡 **Medium** · `contracts` `testing`

**Issue:** The token contract has property-based test snapshots, but the vesting contract (`contracts/vesting`) lacks a comparable test suite covering `create_schedule`, `release`, `revoke`, and edge cases like double-release or revoking after full vest.
**Fix:** Write a comprehensive Rust test module inside `contracts/vesting/src/lib.rs` (or a separate `tests/` dir) covering the full vesting lifecycle and edge cases. Aim for at least 10 test cases.

---

## Phase 6: Indexer & Data 📊

_Replace RPC-event-based data fetching with scalable, reliable indexing._

### 21. Mercury Indexer Integration for Transaction History

🔴 **High** · `frontend` `indexer` `data`

**Issue:** `fetchTransactionHistory` in `lib/stellar.ts` relies on `getEvents` from Soroban RPC, which has limited history and cannot paginate beyond the retention window.
**Fix:** Integrate the Mercury indexer (or Subquery/SubStream alternative) to query historical contract events. Create a new `lib/indexer.ts` module with a `fetchIndexedEvents(contractId, cursor?, limit?)` function and replace the RPC call in the dashboard.

### 22. Token Holder Leaderboard via Horizon Aggregation

🟡 **Medium** · `frontend` `data` `dashboard`

**Issue:** The PRD specifies a "Holder table: address, balance, % of supply" on the dashboard, but there's no implementation aggregating holder balances from Horizon or an indexer.
**Fix:** Create a utility in `lib/stellar.ts` (or a new `lib/holders.ts`) that fetches accounts holding the token from Horizon's `/assets/{code}:{issuer}/accounts` endpoint (or contract-level balance queries) and returns a sorted array `{ address, balance, percentage }[]`. Wire it into the dashboard.

### 23. Real-Time Event Subscription via Soroban RPC `getEvents` Polling

🟡 **Medium** · `frontend` `rpc` `ux`

**Issue:** The dashboard shows stale data until the user manually refreshes. There's no live update mechanism.
**Fix:** Build a `useContractEvents(contractId)` hook that polls `getEvents` on a configurable interval (default 10s) and exposes a stream of new events. Use it in the token dashboard to auto-append new transfers, mints, and burns to the activity feed without a full page reload.

---

## Phase 7: Security, UX & Growth 🚀

_Polish the user experience,lock down the contracts, and prepare for mainnet adoption._

### 24. Contract Upgrade / Migration Safety Pattern

🔴 **High** · `contracts` `security`

**Issue:** Once a token contract is deployed, there's no documented or implemented path to upgrade it. If a critical bug is found, deployed tokens are stuck.
**Fix:** Implement (or document the trade-offs of) an upgradeable proxy pattern using Soroban's `update_current_contract_wasm` mechanism. Add an `upgrade(new_wasm_hash)` admin-only function to the token contract and document its security implications in `docs/contract-upgrade.md`.

### 25. Rate-Limit & Spam Guard for Token Deployment

🟡 **Medium** · `frontend` `security`

**Issue:** Nothing prevents a malicious actor from spamming the deploy flow to create hundreds of junk tokens on testnet/mainnet, bloating state and wasting network resources.
**Fix:** Add client-side rate limiting (e.g., cooldown timer after a successful deploy) and a nonce/captcha check on the deploy page. Store the last deploy timestamp in `localStorage` and disable the deploy button for a configurable window (e.g., 60 seconds). Optionally integrate hCaptcha for mainnet deployments.

### 26. WCAG 2.1 AA Accessibility Audit & Fixes

🟡 **Medium** · `frontend` `accessibility`

**Issue:** The PRD requires WCAG 2.1 AA compliance, but there's no audit trail or tooling to enforce it. Glass-morphism and dark theme styles may have contrast issues.
**Fix:** Run `axe-core` (via `@axe-core/react` or the browser extension) against every page route. Document failures in a new `docs/accessibility-audit.md` and fix at least all critical and serious violations (color contrast, missing labels, keyboard navigation, focus indicators).

### 27. Multi-Language / i18n Support Setup

🟡 **Medium** · `frontend` `i18n` `ux`

**Issue:** All UI copy is hard-coded in English. As a global Stellar ecosystem tool, the launchpad should support multiple languages to lower the barrier for non-English-speaking founders.
**Fix:** Install `next-intl` (or `react-i18next`), extract all user-facing strings from the deploy flow and dashboard into a `messages/en.json` file, and wire up the provider. Add a language switcher in the settings page. This sets the foundation for community-contributed translations.

### 28. Token Metadata & Social Links on Deploy

🟢 **Trivial** · `frontend` `ux`

**Issue:** During token creation, users can only set technical parameters (name, symbol, decimals, supply). There's no way to attach a description, logo URL, website, or social links — metadata that ecosystem explorers and wallets would display.
**Fix:** Add optional fields to the deploy form (Step 2 or 3): `description`, `logoUrl`, `website`, `twitter`, `discord`. Store them client-side (JSON in `localStorage` keyed by contract ID) now and document the plan to persist them on-chain or via IPFS in a future issue.

### 29. "My Deployed Tokens" History on Personal Dashboard

🟡 **Medium** · `frontend` `ux` `dashboard`

**Issue:** After deploying a token, users have to manually save the contract ID. If they lose it, there's no way to find it again from the app. The `my-account` page doesn't list past deployments.
**Fix:** Track deployed contract IDs in `localStorage` (keyed by wallet address) after each successful deploy. Display them as a list on `PersonalDashboard.tsx` with name, symbol, contract ID, and a link to the full token dashboard. Add an "Import Token" field so users can also manually add contract IDs they deployed externally.
