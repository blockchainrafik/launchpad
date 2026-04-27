"use client";

import { Coins } from "lucide-react";
import { truncateAddress } from "@/lib/stellar";

export function BalanceCard({
  assetCode,
  balance,
  assetIssuer,
}: {
  assetCode: string;
  balance: string;
  assetIssuer: string;
}) {
  return (
    <div className="glass-card flex items-center justify-between p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-stellar-500/10">
          <Coins className="h-5 w-5 text-stellar-400" />
        </div>
        <div>
          <p className="text-sm font-semibold text-white">{assetCode}</p>
          {assetIssuer && (
            <p className="text-xs text-gray-500" title={assetIssuer}>
              {truncateAddress(assetIssuer, 4)}
            </p>
          )}
        </div>
      </div>
      <span className="font-mono text-lg font-semibold text-white">
        {parseFloat(balance).toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 7,
        })}
      </span>
    </div>
  );
}
