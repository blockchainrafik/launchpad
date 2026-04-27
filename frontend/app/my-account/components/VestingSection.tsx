"use client";

import type { VestingScheduleInfo } from "@/lib/stellar";
import { VestingCard } from "./VestingCard";
import { VestingLookup } from "./VestingLookup";

export function VestingSection({
  vestingContractId,
  onVestingContractChange,
  onLookup,
  loading,
  error,
  schedule,
  currentLedger,
}: {
  vestingContractId: string;
  onVestingContractChange: (value: string) => void;
  onLookup: () => void;
  loading: boolean;
  error: string | null;
  schedule: VestingScheduleInfo | null;
  currentLedger: number;
}) {
  return (
    <section aria-label="Vesting schedule" className="mb-10">
      <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-gray-500">
        Vesting Schedule
      </h2>
      <VestingLookup
        vestingContractId={vestingContractId}
        onChange={onVestingContractChange}
        onLookup={onLookup}
        loading={loading}
        error={error}
      />

      {schedule && (
        <div className="mt-4">
          <VestingCard
            schedule={schedule}
            contractId={vestingContractId}
            currentLedger={currentLedger}
          />
        </div>
      )}
    </section>
  );
}
