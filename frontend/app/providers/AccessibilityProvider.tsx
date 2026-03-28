"use client";

import { useEffect } from "react";

export function AccessibilityProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      import("../../lib/accessibility").then(({ initAxe }) => {
        initAxe();
      });
    }
  }, []);

  return <>{children}</>;
}
