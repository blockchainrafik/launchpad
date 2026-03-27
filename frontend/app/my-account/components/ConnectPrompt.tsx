"use client";

import { Wallet } from "lucide-react";

export function ConnectPrompt({ onConnect }: { onConnect: () => void }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 text-center animate-fade-in-up">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <Wallet className="h-12 w-12 text-stellar-400" />
      </div>
      <div>
        <h2 className="text-2xl font-bold text-white">Connect Your Wallet</h2>
        <p className="mt-2 max-w-md text-sm text-gray-400">
          Connect your Freighter wallet to view your personal token balances,
          vesting schedules, and transaction history.
        </p>
      </div>
      <button onClick={onConnect} className="btn-primary px-8 py-3 text-sm">
        Connect Wallet
      </button>
    </div>
  );
}
