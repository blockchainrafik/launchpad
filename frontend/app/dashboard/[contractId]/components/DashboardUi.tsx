import { Loader2, AlertCircle } from "lucide-react";

export function LoadingState() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
      <Loader2 className="h-8 w-8 animate-spin text-stellar-400" />
      <p className="text-sm text-gray-400">Fetching token data...</p>
    </div>
  );
}

export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <AlertCircle className="h-10 w-10 text-red-400" />
      <p className="max-w-md text-gray-400">{message}</p>
      <button onClick={onRetry} className="btn-secondary px-4 py-2 text-sm">
        Retry
      </button>
    </div>
  );
}
