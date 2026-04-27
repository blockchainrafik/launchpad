# Post-Deployment Token Minting Interface

**Issue:** #129 — [BUG] Post-Deployment Token Minting Interface

## Overview

The post-deployment token minting interface resolves a limitation where tokens deployed without a fixed maximum supply could not be minted further via the frontend UI. The existing `AdminPanel` component was successfully integrated into the `TokenDashboard`, giving authorized token administrators direct access to mint additional tokens directly from their dashboard.

## Implementation Details

### 1. `TokenInfo` Expansion (`lib/stellar.ts`)
The `fetchTokenInfo` method was updated to simulate a call for `max_supply`. 
- Returns `maxSupply: string` when an explicit supply limit exists.
- Returns `maxSupply: null` for uncapped, community-driven tokens (which allows minting indefinitely).

### 2. Admin Authentication (`TokenDashboard.tsx`)
The `AdminPanel` is conditionally rendered. It only appears if the connected wallet address (fetched via `useWallet()`) matches the `admin` public key stored in the token's on-chain metadata.

### 3. Minting Boundary Logic (`AdminPanel.tsx`)
The `AdminPanel` itself was enhanced to evaluate whether the token explicitly permits minting. The "Mint Assets" card within the dashboard is only rendered if:
- `maxSupply` is unconstrained (`null` or `"N/A"`).
- `totalSupply` is strictly less than `maxSupply` (when capped).

If the token has hit its hard limit, the minting card is automatically hidden to prevent unexecutable user actions, whilst leaving access to other administrative controls (e.g. burn, transfer admin, vesting).

## Testing

A new test file `__tests__/stellar.test.ts` was added to verify that `fetchTokenInfo` properly interacts with the Soroban RPC to extract and format the `max_supply` XDR properly when available, and fails gracefully when the token lacks such limits.
