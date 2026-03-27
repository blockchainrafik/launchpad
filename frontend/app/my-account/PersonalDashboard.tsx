"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useWallet } from "../hooks/useWallet";
import { useSoroban } from "@/hooks/useSoroban";
import {
  type AccountBalance,
  type VestingScheduleInfo,
  type TokenActivityInfo,
} from "@/lib/stellar";
import { ConnectPrompt } from "./components/ConnectPrompt";
import { PersonalHeader } from "./components/PersonalHeader";
import { BalancesSection } from "./components/BalancesSection";
import { VestingSection } from "./components/VestingSection";
import { PersonalTransactionsSection } from "./components/PersonalTransactionsSection";

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function PersonalDashboard() {
  const { connected, publicKey, connect } = useWallet();
  const {
    fetchVestingSchedule,
    fetchCurrentLedger,
    fetchAccountBalances,
    fetchAccountOperations,
  } = useSoroban();

  // Balances
  const [balances, setBalances] = useState<AccountBalance[]>([]);
  const [balancesLoading, setBalancesLoading] = useState(false);
  const [balancesError, setBalancesError] = useState<string | null>(null);

  // Vesting
  const [vestingContractId, setVestingContractId] = useState("");
  const [vestingSchedule, setVestingSchedule] =
    useState<VestingScheduleInfo | null>(null);
  const [vestingLoading, setVestingLoading] = useState(false);
  const [vestingError, setVestingError] = useState<string | null>(null);
  const [currentLedger, setCurrentLedger] = useState(0);

  // Transaction history
  const [operations, setOperations] = useState<TokenActivityInfo[]>([]);
  const [txLoading, setTxLoading] = useState(false);
  const [txLoadingMore, setTxLoadingMore] = useState(false);
  const [txNextCursor, setTxNextCursor] = useState<string | null>(null);
  const cursorRef = useRef<string | null>(null);
  cursorRef.current = txNextCursor;

  // Refreshing state
  const [refreshing, setRefreshing] = useState(false);

  // Fetch balances
  const loadBalances = useCallback(async () => {
    if (!publicKey) return;
    setBalancesLoading(true);
    setBalancesError(null);
    try {
      const data = await fetchAccountBalances(publicKey);
      setBalances(data);
    } catch (err) {
      setBalancesError(
        err instanceof Error ? err.message : "Failed to fetch balances.",
      );
    } finally {
      setBalancesLoading(false);
    }
  }, [publicKey, fetchAccountBalances]);

  // Fetch personal transactions
  const loadTransactions = useCallback(
    async (isLoadMore = false) => {
      if (!publicKey) return;
      if (!isLoadMore) setTxLoading(true);
      if (isLoadMore) setTxLoadingMore(true);

      try {
        const cursor = isLoadMore ? cursorRef.current : undefined;
        const { records, nextCursor } = await fetchAccountOperations(
          publicKey,
          cursor ?? undefined,
          15,
        );

        if (isLoadMore) {
          setOperations((prev) => [...prev, ...records]);
        } else {
          setOperations(records);
        }
        setTxNextCursor(nextCursor);
      } catch {
        // Silently fail for tx feed on refresh
        if (!isLoadMore) setOperations([]);
      } finally {
        if (!isLoadMore) setTxLoading(false);
        if (isLoadMore) setTxLoadingMore(false);
      }
    },
    [publicKey, fetchAccountOperations],
  );

  // Load vesting schedule
  const lookupVesting = useCallback(async () => {
    if (!publicKey || !vestingContractId.trim()) return;
    setVestingLoading(true);
    setVestingError(null);
    setVestingSchedule(null);
    try {
      const [schedule, ledger] = await Promise.all([
        fetchVestingSchedule(vestingContractId.trim(), publicKey),
        fetchCurrentLedger(),
      ]);
      setVestingSchedule(schedule);
      setCurrentLedger(ledger);
    } catch (err) {
      setVestingError(
        err instanceof Error
          ? err.message
          : "Failed to fetch vesting schedule. Check the contract ID.",
      );
    } finally {
      setVestingLoading(false);
    }
  }, [publicKey, vestingContractId, fetchVestingSchedule, fetchCurrentLedger]);

  // Initial data load
  useEffect(() => {
    if (connected && publicKey) {
      loadBalances();
      loadTransactions();
    }
  }, [connected, publicKey, loadBalances, loadTransactions]);

  // Refresh all
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadBalances(), loadTransactions()]);
    setRefreshing(false);
  }, [loadBalances, loadTransactions]);

  // Not connected
  if (!connected || !publicKey) {
    return <ConnectPrompt onConnect={connect} />;
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-10 animate-fade-in-up">
      <PersonalHeader
        publicKey={publicKey}
        refreshing={refreshing}
        onRefresh={handleRefresh}
      />

      <BalancesSection
        balances={balances}
        loading={balancesLoading}
        error={balancesError}
        onRetry={loadBalances}
      />

      <VestingSection
        vestingContractId={vestingContractId}
        onVestingContractChange={setVestingContractId}
        onLookup={lookupVesting}
        loading={vestingLoading}
        error={vestingError}
        schedule={vestingSchedule}
        currentLedger={currentLedger}
      />

      <PersonalTransactionsSection
        operations={operations}
        loading={txLoading}
        loadingMore={txLoadingMore}
        hasMore={txNextCursor !== null}
        onLoadMore={() => loadTransactions(true)}
        publicKey={publicKey}
      />
    </div>
  );
}
