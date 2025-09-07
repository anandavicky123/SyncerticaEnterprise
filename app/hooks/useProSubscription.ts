import { useState, useEffect } from "react";

interface ProStatus {
  isPro: boolean;
  isLoading: boolean;
  error: Error | null;
}

export function useProSubscription(managerId: string | undefined): ProStatus {
  const [status, setStatus] = useState<ProStatus>({
    isPro: false,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    if (!managerId) {
      setStatus({
        isPro: false,
        isLoading: false,
        error: new Error("No manager ID provided"),
      });
      return;
    }

    async function checkProStatus() {
      try {
        const response = await fetch(
          `/api/subscription/status?managerId=${managerId}`
        );
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to check subscription status");
        }

        setStatus({
          isPro: data.isPro,
          isLoading: false,
          error: null,
        });
      } catch (error) {
        setStatus({
          isPro: false,
          isLoading: false,
          error: error instanceof Error ? error : new Error("Unknown error"),
        });
      }
    }

    checkProStatus();
  }, [managerId]);

  return status;
}
