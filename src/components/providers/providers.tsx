"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { Toaster } from "sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 30_000, refetchOnWindowFocus: false, retry: 1 },
        },
      }),
  );
  return (
    <QueryClientProvider client={client}>
      {children}
      <Toaster
        position="bottom-center"
        offset={88}
        mobileOffset={88}
        toastOptions={{
          className:
            "!rounded-control !border !border-border !bg-text !text-bg !text-[13px] !shadow-float !font-sans",
        }}
      />
    </QueryClientProvider>
  );
}
