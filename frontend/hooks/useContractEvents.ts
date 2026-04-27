import { useState, useEffect, useRef } from "react";
import * as StellarSdk from "@stellar/stellar-sdk";
import { useNetwork } from "@/app/providers/NetworkProvider";
import {
  type TokenActivityInfo,
  toScVal,
  decodeString,
  decodeI128,
  decodeAddress,
  readEventTopics,
  readEventId,
  readEventTxHash,
  readEventLedger,
  readEventTimestamp,
} from "@/lib/stellar";

interface UseContractEventsOptions {
  intervalMs?: number;
}

interface RpcEvent {
  id?: string;
  pagingToken?: string;
  contractId?: string;
  ledger?: number;
  ledgerClosedAt?: string;
  topic?: string[];
  value?: string;
  txHash?: string;
}

export function useContractEvents(
  contractId: string,
  options?: UseContractEventsOptions,
) {
  const { networkConfig } = useNetwork();
  const [events, setEvents] = useState<TokenActivityInfo[]>([]);
  const [error, setError] = useState<Error | null>(null);
  
  const startLedgerRef = useRef<number | null>(null);
  const intervalMs = options?.intervalMs ?? 10000;

  useEffect(() => {
    if (!contractId || !networkConfig?.rpcUrl) return;

    const rpc = new StellarSdk.rpc.Server(networkConfig.rpcUrl);
    // TypeScript workaround since getEvents is experimental/not fully typed in some SDK versions
    const getEvents = (
      rpc as unknown as {
        getEvents?: (req: unknown) => Promise<{ events?: RpcEvent[] }>;
      }
    ).getEvents;

    if (!getEvents) {
      console.warn("getEvents is not available on this RPC server instance");
      return;
    }

    let isMounted = true;
    let timerId: ReturnType<typeof setTimeout> | null = null;
    let isPolling = false;

    // Helper to safely fetch events and catch errors
    const safeGetEvents = async (startLedger: number) => {
      try {
        const response = await getEvents.call(rpc, {
          startLedger,
          filters: [{ type: "contract", contractIds: [contractId] }],
          pagination: { limit: 100 }, // Fetch up to 100 latest events
        });
        return response?.events ?? [];
      } catch (err) {
        console.error("Error polling getEvents:", err);
        return [];
      }
    };

    const poll = async () => {
      if (!isMounted || isPolling) return;
      isPolling = true;

      try {
        // If we don't have a starting ledger, initialize it to the latest ledger
        if (startLedgerRef.current === null) {
          const { sequence } = await rpc.getLatestLedger();
          startLedgerRef.current = sequence;
        }

        const rawEvents = await safeGetEvents(startLedgerRef.current);
        
        if (!isMounted) return;

        const newRecords: TokenActivityInfo[] = [];
        let maxLedgerSeen = startLedgerRef.current;

        for (const evt of rawEvents) {
          const evtLedger = readEventLedger(evt) || startLedgerRef.current;
          if (evtLedger > maxLedgerSeen) {
            maxLedgerSeen = evtLedger;
          }

          const topics = readEventTopics(evt);
          if (topics.length === 0) continue;

          const topic0 = toScVal(topics[0]);
          if (!topic0) continue;

          const typePath = decodeString(topic0);
          if (
            typePath !== "mint" &&
            typePath !== "burn" &&
            typePath !== "transfer"
          ) {
            continue;
          }

          const data = toScVal(
            (evt as { value?: unknown; data?: unknown }).value ??
              (evt as { data?: unknown }).data,
          );
          
          if (!data) continue;

          const amount = decodeI128(data);
          let from = "-";
          let to = "-";

          if (typePath === "mint" && topics.length > 1) {
            const toVal = toScVal(topics[1]);
            if (toVal) to = decodeAddress(toVal);
          } else if (typePath === "burn" && topics.length > 1) {
            const fromVal = toScVal(topics[1]);
            if (fromVal) from = decodeAddress(fromVal);
          } else if (typePath === "transfer" && topics.length > 2) {
            const fromVal = toScVal(topics[1]);
            const toVal = toScVal(topics[2]);
            if (fromVal) from = decodeAddress(fromVal);
            if (toVal) to = decodeAddress(toVal);
          }

          newRecords.push({
            id: readEventId(evt, `${readEventTxHash(evt)}-${evtLedger}`),
            pagingToken: evt.pagingToken ?? "",
            type: typePath as TokenActivityInfo["type"],
            amount,
            from,
            to,
            timestamp: readEventTimestamp(evt),
            txHash: readEventTxHash(evt),
          });
        }

        // Advance the ledger so we don't re-fetch old events
        // +1 if we want to strictly ask for new ledgers next time
        if (maxLedgerSeen >= startLedgerRef.current) {
          startLedgerRef.current = maxLedgerSeen + 1;
        }

        if (newRecords.length > 0) {
          // Sort descending by ledger/timestamp if needed, though they usually arrive in order.
          setEvents((prev: TokenActivityInfo[]) => {
            const addedIds = new Set(prev.map((p: TokenActivityInfo) => p.id));
            const uniqueNew = newRecords.filter((r: TokenActivityInfo) => !addedIds.has(r.id));
            if (uniqueNew.length === 0) return prev;
            // Prepend new events (newest first in typical feeds, though we should check how ActivityFeed renders)
            // The ActivityFeed displays newest first. So we prepend unique new records.
            // Reverse uniqueNew if it came in oldest->newest, but usually we just prepend.
            return [...uniqueNew.reverse(), ...prev];
          });
        }
        
        setError(null);
      } catch (err) {
        if (isMounted) setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        isPolling = false;
      }
    };

    // Initial poll
    poll();

    // Setup interval
    timerId = setInterval(poll, intervalMs);

    return () => {
      isMounted = false;
      if (timerId) clearInterval(timerId);
    };
  }, [contractId, networkConfig, intervalMs]);

  return { events, error };
}
