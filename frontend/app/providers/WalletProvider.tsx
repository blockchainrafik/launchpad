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
import type { WalletAdapter } from "../lib/wallets";
import { getWalletAdapter } from "../lib/wallets";
import { WalletModal } from "../components/WalletModal";

/* ── Public context shape ─────────────────────────────────────────── */
export interface WalletContextValue {
  /** Whether the wallet is currently connected and authorised */
  connected: boolean;
  /** The Stellar public key (G…) when connected, otherwise `null` */
  publicKey: string | null;
  /** Whether a connect / disconnect operation is in-flight */
  loading: boolean;
  /** The currently connected wallet adapter ID */
  walletId: string | null;
  /** The currently connected wallet name */
  walletName: string | null;
  /** Request wallet access and retrieve the public key (opens wallet selection modal) */
  connect: () => Promise<void>;
  /** Revoke local connection state */
  disconnect: () => void;
  /**
   * Sign a Soroban / Stellar transaction XDR with the connected wallet.
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

/* ── Local storage keys ───────────────────────────────────────────── */
const STORAGE_KEY_WALLET_ID = "soropad_wallet_id";
const STORAGE_KEY_PUBLIC_KEY = "soropad_public_key";

/* ── Provider ─────────────────────────────────────────────────────── */
export function WalletProvider({ children }: { children: ReactNode }) {
  const { networkConfig } = useNetwork();
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [walletId, setWalletId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const connected = publicKey !== null;
  const walletName = walletId
    ? getWalletAdapter(walletId)?.name || null
    : null;

  /* ── Auto-reconnect on mount ──────────────────────────────────── */
  useEffect(() => {
    let cancelled = false;

    async function reconnect() {
      if (typeof window === "undefined") return;

      try {
        const savedWalletId = localStorage.getItem(STORAGE_KEY_WALLET_ID);
        const savedPublicKey = localStorage.getItem(STORAGE_KEY_PUBLIC_KEY);

        if (!savedWalletId || !savedPublicKey) return;

        const adapter = getWalletAdapter(savedWalletId);
        if (!adapter) return;

        const isAvailable = await adapter.isAvailable();
        if (!isAvailable) return;

        const currentKey = await adapter.getPublicKey();
        if (!cancelled && currentKey === savedPublicKey) {
          setWalletId(savedWalletId);
          setPublicKey(savedPublicKey);
        }
      } catch {
        // Wallet not available — silently ignore
      }
    }

    reconnect();
    return () => {
      cancelled = true;
    };
  }, []);

  /* ── handleWalletSelect() ─────────────────────────────────────── */
  const handleWalletSelect = useCallback(async (adapter: WalletAdapter) => {
    setLoading(true);
    try {
      const address = await adapter.connect();
      
      if (address) {
        setPublicKey(address);
        setWalletId(adapter.id);
        
        // Persist to localStorage
        if (typeof window !== "undefined") {
          localStorage.setItem(STORAGE_KEY_WALLET_ID, adapter.id);
          localStorage.setItem(STORAGE_KEY_PUBLIC_KEY, address);
        }
      }
    } catch (err) {
      console.error("[WalletProvider] connect failed:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /* ── connect() ────────────────────────────────────────────────── */
  const connect = useCallback(async () => {
    setShowModal(true);
  }, []);

  /* ── disconnect() ─────────────────────────────────────────────── */
  const disconnect = useCallback(() => {
    setPublicKey(null);
    setWalletId(null);
    
    // Clear localStorage
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEY_WALLET_ID);
      localStorage.removeItem(STORAGE_KEY_PUBLIC_KEY);
    }
  }, []);

  /* ── signTransaction() ────────────────────────────────────────── */
  const signTransaction = useCallback(
    async (
      xdr: string,
      opts?: { networkPassphrase?: string; address?: string },
    ): Promise<string> => {
      if (!walletId) {
        throw new Error("No wallet connected");
      }

      const adapter = getWalletAdapter(walletId);
      if (!adapter) {
        throw new Error("Wallet adapter not found");
      }

      const finalOpts = {
        networkPassphrase: networkConfig.passphrase,
        ...opts,
      };

      return await adapter.signTransaction(xdr, finalOpts);
    },
    [walletId, networkConfig.passphrase],
  );

  /* ── Memoised value ───────────────────────────────────────────── */
  const value = useMemo<WalletContextValue>(
    () => ({
      connected,
      publicKey,
      loading,
      walletId,
      walletName,
      connect,
      disconnect,
      signTransaction,
    }),
    [connected, publicKey, loading, walletId, walletName, connect, disconnect, signTransaction],
  );

  return (
    <WalletContext.Provider value={value}>
      {children}
      <WalletModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSelectWallet={handleWalletSelect}
      />
    </WalletContext.Provider>
  );
}
