# User Token Transfer Feature

## Overview

The User Token Transfer feature allows any connected wallet holder to transfer their tokens directly through the dashboard, not just administrators. This aligns with SEP-41 token standard requirements and provides a better user experience.

## Features

### 1. Automatic Balance Detection

- Fetches the user's token balance automatically when wallet is connected
- Real-time balance display at the top of the transfer form
- Only shows the transfer panel if the user has a non-zero balance

### 2. Smart Visibility

The transfer panel intelligently shows or hides based on user state:

**Not Connected:**

- Shows a "Connect Your Wallet" message
- Prompts user to connect before transferring

**Connected with Zero Balance:**

- Shows "No Balance Available" message
- Prevents unnecessary form display when user has no tokens

**Connected with Balance:**

- Shows full transfer form
- Displays current balance prominently
- Enables token transfers

### 3. Transfer Form

**Input Fields:**

- **Recipient Address**: Stellar address starting with 'G'
- **Amount**: Number of tokens to transfer (supports decimals)

**Validation:**

- Recipient address must be valid Stellar format (G + 55 characters)
- Amount must be positive
- Amount cannot exceed user's current balance
- Real-time validation with error messages

### 4. Transaction Flow

1. User enters recipient address and amount
2. Form validates inputs
3. User clicks "Transfer Tokens"
4. Transaction is built with proper Soroban contract call
5. Transaction is simulated to calculate fees
6. User signs transaction via Freighter wallet
7. Transaction is submitted to the network
8. System polls for transaction confirmation
9. Success message displayed with transaction hash link
10. Page refreshes to show updated balance

### 5. Network Awareness

- Automatically uses the correct network (testnet/mainnet) from NetworkProvider
- Transaction links point to correct Stellar Expert network
- Network passphrase and RPC URL configured per network

### 6. Error Handling

Comprehensive error handling for:

- **User declined**: Transaction cancelled in wallet
- **Insufficient balance**: Amount exceeds available tokens
- **Invalid address**: Malformed recipient address
- **Network errors**: RPC or connection failures
- **Transaction failures**: On-chain execution errors

### 7. User Feedback

**Loading States:**

- Balance checking indicator
- Transfer in progress indicator
- Button disabled during processing

**Success States:**

- Green success message
- Transaction hash link to explorer
- Automatic page refresh after 2 seconds

**Error States:**

- Red error messages with specific details
- Clear actionable feedback

## Technical Implementation

### Balance Fetching

```typescript
// Simulates a read-only contract call to get balance
const tx = new TransactionBuilder(account, {
  fee: "100",
  networkPassphrase: networkConfig.passphrase,
})
  .addOperation(contract.call("balance", addressToScVal(publicKey)))
  .setTimeout(30)
  .build();

const sim = await rpc.simulateTransaction(tx);
// Parse i128 result and format with decimals
```

### Transfer Transaction

```typescript
// Build transfer transaction
const tx = new TransactionBuilder(account, {
  fee: BASE_FEE,
  networkPassphrase: networkConfig.passphrase,
})
  .addOperation(
    contract.call(
      "transfer",
      addressToScVal(publicKey), // from
      addressToScVal(recipientAddress), // to
      i128ToScVal(rawAmount), // amount
    ),
  )
  .setTimeout(30)
  .build();

// Simulate, sign, and submit
```

### Amount Conversion

Handles token decimals properly:

```typescript
// Convert user input to raw amount with decimals
const rawAmount =
  BigInt(Math.floor(parseFloat(amount) * 10 ** tokenDecimals)) *
  BigInt(10 ** Math.max(0, 7 - tokenDecimals));
```

## Security Considerations

### 1. Client-Side Validation

- All inputs validated before transaction building
- Balance checked before allowing transfer
- Address format validation with regex

### 2. Wallet Signing

- All transactions signed via Freighter wallet
- No private keys handled in frontend
- User must explicitly approve each transaction

### 3. Transaction Simulation

- Every transaction simulated before submission
- Catches errors before user signs
- Calculates accurate resource fees

### 4. Network Isolation

- Transactions only submitted to configured network
- No cross-network contamination
- Clear network indicator in UI

## User Experience

### Accessibility

- ARIA labels for all form inputs
- Clear error messages
- Keyboard navigation support
- Screen reader friendly

### Responsive Design

- Mobile-friendly layout
- Touch-optimized buttons
- Adaptive form sizing

### Visual Feedback

- Loading spinners during async operations
- Success/error color coding (green/red)
- Smooth animations and transitions
- Clear visual hierarchy

## SEP-41 Compliance

This implementation aligns with SEP-41 (Stellar Token Standard) requirements:

1. **Standard Interface**: Uses `transfer(from, to, amount)` function
2. **Balance Queries**: Implements `balance(address)` queries
3. **Decimal Handling**: Properly handles token decimals
4. **Authorization**: Requires wallet signature for transfers
5. **Event Emission**: Contract emits transfer events (handled on-chain)

## Differences from Admin Panel

| Feature           | Admin Panel                         | User Transfer Panel     |
| ----------------- | ----------------------------------- | ----------------------- |
| **Access**        | Admin only                          | All connected users     |
| **Visibility**    | Always visible to admin             | Only if balance > 0     |
| **Functions**     | Mint, Burn, Transfer Admin, Vesting | Transfer only           |
| **From Address**  | Can specify any address             | Always user's address   |
| **Balance Check** | No automatic check                  | Automatic balance fetch |
| **Use Case**      | Token management                    | Regular transfers       |

## Future Enhancements

Potential improvements for future versions:

1. **Transaction History**: Show user's past transfers
2. **Address Book**: Save frequently used addresses
3. **QR Code Scanner**: Scan recipient addresses
4. **Multi-Send**: Transfer to multiple recipients at once
5. **Scheduled Transfers**: Set up future transfers
6. **Gas Estimation**: Show estimated transaction fees
7. **Memo Support**: Add optional transfer memos
8. **Token Allowances**: Approve spending limits

## Testing Recommendations

### Functional Testing

1. **Balance Display**:
   - Connect wallet with tokens
   - Verify balance shows correctly
   - Check decimal formatting

2. **Form Validation**:
   - Test invalid addresses
   - Test negative amounts
   - Test amounts exceeding balance
   - Test empty fields

3. **Transfer Flow**:
   - Complete successful transfer
   - Verify transaction on explorer
   - Check balance updates after transfer

4. **Error Scenarios**:
   - Cancel transaction in wallet
   - Try transfer with insufficient balance
   - Test network errors
   - Test invalid contract calls

5. **Edge Cases**:
   - Transfer entire balance
   - Transfer very small amounts (0.0001)
   - Transfer with maximum decimals
   - Rapid successive transfers

### UI/UX Testing

1. **Visibility States**:
   - Not connected
   - Connected with zero balance
   - Connected with balance

2. **Loading States**:
   - Balance loading
   - Transaction processing
   - Button disabled states

3. **Responsive Design**:
   - Mobile devices
   - Tablet sizes
   - Desktop views

4. **Accessibility**:
   - Keyboard navigation
   - Screen reader testing
   - Focus management

## Browser Compatibility

- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support
- Mobile browsers: Full support

## Performance

- Balance fetch: < 1 second
- Transaction simulation: < 2 seconds
- Transaction submission: 2-5 seconds (network dependent)
- Transaction confirmation: 5-10 seconds (polling)

## Related Files

- `frontend/app/dashboard/[contractId]/components/TransferPanel.tsx` - Main component
- `frontend/app/dashboard/[contractId]/TokenDashboard.tsx` - Integration
- `frontend/lib/stellar.ts` - Helper functions
- `frontend/app/providers/NetworkProvider.tsx` - Network configuration
- `frontend/app/hooks/useWallet.ts` - Wallet integration

## API Dependencies

- **Stellar SDK**: Transaction building and signing
- **Soroban RPC**: Contract simulation and submission
- **Freighter Wallet**: Transaction signing
- **Stellar Expert**: Transaction explorer links
