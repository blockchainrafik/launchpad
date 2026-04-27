# 📋 Pending GitHub Issues — Soroban Token Launchpad

The issues below are organized sequentially to prevent blockers or merge conflicts during implementation.

Complexity levels match the Stellar Wave Program on Drips:

- 🟢 **Trivial** (100 pts) — Small, well-defined, great for first-timers
- 🟡 **Medium** (150 pts) — Standard features or involved bug fixes
- 🔴 **High** (200 pts) — Complex features, integrations, or refactors

---

## Phase 1: DevEx & Foundation 🏗️

_Set up the environment, scripts, and base connection logic before building upon them._

### 1. Local Soroban Standalone Network Script

🟡 **Medium** · `devex` `scripts`

**Issue:** Testing changes requires public testnet, which is slow.
**Fix:** Write a local `docker-compose.yml` or shell script to spin up a standalone Soroban node for instant local testing, and document it in `CONTRIBUTING.md`.

### 2. Environment-Aware Network Variables

🟡 **Medium** · `frontend` `configuration`

**Issue:** The network toggle (`NetworkProvider.tsx`) doesn't correctly separate or hot-swap `mainnet` and `testnet` environment variables for downstream dependencies. like in `lib/stellar.ts`.
**Fix:** Update the provider logic to ensure switching networks properly redirects the underlying RPC and Horizon environment configurations.

### 3. Persist Custom RPC/Horizon Settings to Local Storage

🟡 **Medium** · `frontend` `settings`

**Issue:** Currently, RPC and Horizon URLs aren't fully persistent.
**Fix:** In `SettingsProvider`, load from `localStorage` first. If not found, fallback to environment variables based on the currently selected network. Ensure user modifications update `localStorage`.

### 4. Audit and Document all Simulations in `stellar.ts`

🟢 **Trivial** · `frontend` `documentation`

**Issue:** We still have scattered simulated/mock functions in `lib/stellar.ts`.
**Fix:** Simply list them out or add clear `@TODO` comments to track them for future implementation tasks.

---

## Phase 2: Smart Contracts 🔐

_Update the on-chain logic before building the UI components that interact with them._

### 5. Implement `total_burned()` tracking

🟡 **Medium** · `contracts` `analytics`

**Issue:** Currently, `burn` operations decrease the `total_supply`, but the contract does not track the aggregate amount of tokens ever burned. This makes it impossible to display "Total Burned" stats accurately in the UI.
**Fix:** Add tracking for total burned amount in the token contract (`contracts/token/src/lib.rs`). Ensure to verify logic and emit proper state updates.

### 6. Add `burn` authorization for token owners

🟡 **Medium** · `contracts` `sep-41`

**Issue:** The current `burn` function may be overly restrictive or missing user-initiated burning. According to SEP-41, token owners should be able to burn their own holdings.
**Fix:** Expose a proper `burn_self` or authorized burn mechanism for non-admins to burn their own tokens. Add associated tests.

### 7. Implement `mint_batch` in Token Contract

🔴 **High** · `contracts` `optimization`

**Issue:** Launching a project often involves distributing tokens to many early supporters. Sending 100 individual `mint` transactions is expensive and slow.
**Fix:** Add `mint_batch` function handling multiple addresses and amounts at once.

---

## Phase 3: Core Architecture & RPC Integration ⚙️

_Modularize the app and hook it up to real RPC calls._

### 8. Modularize `TokenDashboard.tsx` and `PersonalDashboard.tsx`

🟡 **Medium** · `frontend` `refactor`

**Issue:** `app/dashboard/[contractId]/TokenDashboard.tsx` and `app/my-account/PersonalDashboard.tsx` has grown too large and handles too many responsibilities.
**Fix:** Break the component down into smaller, focused, modular files handling specific UI or specific data-fetching tasks.

### 9. Replace Pre-flight "Check" Simulation with Real RPC Call

🔴 **High** · `frontend` `rpc`

**Issue:** The "Check" button during token deployment (`StepReview.tsx`) is currently simulating a successful response with a fake timeout.
**Fix:** Integrate actual `simulateTransaction` calls to Soroban RPC to perform legitimate pre-flight checks before prompting the wallet signature.

### 10. Implement Real Token Deployment Submission

🔴 **High** · `frontend` `rpc`

**Issue:** The `DeployFormData` submission (`onSubmit`) handles the deployment with a simulated delay and generic alert instead of broadcasting a real transaction.
**Fix:** Build the token deployment transaction, simulate it, handle wallet signatures, and broadcast to the network.

### 11. Fetch Real Supply Breakdown for Dashboard

🟡 **Medium** · `frontend` `rpc`

**Issue:** The `fetchSupplyBreakdown` function provides simulated mock data instead of reading from the real token and vesting contracts.
**Fix:** Replace the simulation logic with real Soroban RPC calls to properly populate the charts and analytics based on Phase 2's added metrics.

fetchSupplyBreakdown: Uses estimates/placeholders for Circulating Supply, Locked/Vested Supply, and Total Burned tokens instead of real state checks.
fetchTransactionHistory: Relies directly on getEvents from RPC, which has limited history; should be replaced with a proper indexer query.
fetchApprovedSpendersFromEvents: Relies on sweeping RPC events, which is bounded and not fully robust; requires an indexer.
fetchAccountOperations: Has conditional/heuristic logic that relies on basic Horizon endpoints instead of querying a proper smart contract indexer like Mercury.

---

## Phase 4: UI Features & Enhancements 🎨

_Build high-level user features that depend on the rest of the application._

### 12. "Connect Ledger" Support

🔴 **High** · `frontend` `security` `wallet`

**Issue:** Currently missing hardware wallet integration for admins using high-value accounts.
**Fix:** Integrate `@stellar/stellar-sdk`'s hardware wallet support directly into the connection flow and update the `useWallet` hook.

### 13. "Batch Mint" Feature in Admin Panel

🟡 **Medium** · `frontend` `admin`

**Issue:** Admins need a UI to paste or upload multiple addresses to mint to simultaneously.
**Fix:** Build a form for batch minting that interfaces with the new `mint_batch` smart contract implementation from Phase 2.

### 14. Interactive Vesting Curve Designer

🔴 **High** · `frontend` `vesting` `ux`

**Issue:** Setting cliff and duration ledgers is counter-intuitive without visual feedback.
**Fix:** Add a real-time `recharts` area chart to `VestingForm.tsx` that maps out the unlock schedule dynamically as the user inputs "Cliff Days" and "Duration Days".

### 15. Discord/Telegram Webhook Alerts

🟡 **Medium** · `frontend` `admin`

**Issue:** Project owners want to be notified instantly when someone claims vested tokens or when a large transfer occurs.
**Fix:** Add webhook configuration UI to settings and trigger notifications to the saved URL.

### 16. Export Mint/Transfer History to PDF/XLS

🟢 **Trivial** · `frontend` `accounting`

**Issue:** Founders need exportable reports from the History feed.
**Fix:** Add export logic inside `TransactionHistory.tsx` to generate CSV/XLS or PDF formats for the frontend table data.
