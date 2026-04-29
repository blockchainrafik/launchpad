"use client";

import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useNetwork } from "./NetworkProvider";
import {
  isConnected as freighterIsConnected,
  isAllowed as freighterIsAllowed,
  setAllowed as freighterSetAllowed,
  getAddress as freighterGetAddress,
  signTransaction as freighterSignTransaction,
} from "@stellar/freighter-api";

/* ── Public context shape ─────────────────────────────────────────── */
export interface WalletContextValue {
  /** Whether the wallet is currently connected and authorised */
  connected: boolean;
  /** The Stellar public key (G…) when connected, otherwise `null` */
  publicKey: string | null;
  /** Whether a connect / disconnect operation is in-flight */
  loading: boolean;
  /** Request Freighter access and retrieve the public key */
  connect: () => Promise<void>;
  /** Revoke local connection state (Freighter has no "disconnect" RPC) */
  disconnect: () => void;
  /**
   * Sign a Soroban / Stellar transaction XDR with Freighter.
   * Returns the signed XDR string.
   */
  signTransaction: (
    xdr: string,
    opts?: { networkPassphrase?: string; address?: string },
  ) => Promise<string>;
}

export const WalletContext = createContext<WalletContextValue | undefined>(
  undefined,
);

/* ── Provider ─────────────────────────────────────────────────────── */
export function WalletProvider({ children }: { children: ReactNode }) {
  const { networkConfig } = useNetwork();
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const connected = publicKey !== null;

  /* ── Auto-reconnect on mount ──────────────────────────────────── */
  useEffect(() => {
    let cancelled = false;

    async function reconnect() {
      try {
        const storedAddress = localStorage.getItem("soropad:wallet:address");
        const storedTimestamp = localStorage.getItem("soropad:wallet:timestamp");
        
        const { isConnected: installed } = await freighterIsConnected();
        if (!installed) return;

        const { isAllowed: allowed } = await freighterIsAllowed();
        if (!allowed) {
          if (storedAddress) {
            localStorage.removeItem("soropad:wallet:address");
            localStorage.removeItem("soropad:wallet:timestamp");
          }
          return;
        }

        const { address } = await freighterGetAddress();
        if (!cancelled && address) {
          setPublicKey(address);
          
          if (storedAddress !== address || !storedTimestamp) {
            localStorage.setItem("soropad:wallet:address", address);
            localStorage.setItem("soropad:wallet:timestamp", Date.now().toString());
          }
        }
      } catch {
        localStorage.removeItem("soropad:wallet:address");
        localStorage.removeItem("soropad:wallet:timestamp");
      }
    }

    reconnect();
    return () => {
      cancelled = true;
    };
  }, []);

  /* ── connect() ────────────────────────────────────────────────── */
  const connect = useCallback(async () => {
    setLoading(true);
    try {
      const { isConnected: installed } = await freighterIsConnected();
      if (!installed) {
        window.open("https://www.freighter.app/", "_blank");
        return;
      }

      await freighterSetAllowed();

      const { address, error } = await freighterGetAddress();
      if (error) {
        console.error("[WalletProvider] getAddress error:", error);
        return;
      }

      if (address) {
        setPublicKey(address);
        localStorage.setItem("soropad:wallet:address", address);
        localStorage.setItem("soropad:wallet:timestamp", Date.now().toString());
      }
    } catch (err) {
      console.error("[WalletProvider] connect failed:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  /* ── disconnect() ─────────────────────────────────────────────── */
  const disconnect = useCallback(() => {
    setPublicKey(null);
    localStorage.removeItem("soropad:wallet:address");
    localStorage.removeItem("soropad:wallet:timestamp");
  }, []);

  /* ── signTransaction() ────────────────────────────────────────── */
  const signTransaction = useCallback(
    async (
      xdr: string,
      opts?: { networkPassphrase?: string; address?: string },
    ): Promise<string> => {
      const finalOpts = {
        networkPassphrase: networkConfig.passphrase,
        ...opts,
      };
      const { signedTxXdr, error } = await freighterSignTransaction(
        xdr,
        finalOpts,
      );
      if (error) {
        throw new Error(error);
      }
      return signedTxXdr;
    },
    [networkConfig.passphrase],
  );

  /* ── Memoised value ───────────────────────────────────────────── */
  const value = useMemo<WalletContextValue>(
    () => ({
      connected,
      publicKey,
      loading,
      connect,
      disconnect,
      signTransaction,
    }),
    [connected, publicKey, loading, connect, disconnect, signTransaction],
  );

  return (
    <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
  );
}
