import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "react-router";
import { ToastProvider } from "@/components/ui";
import { ThemeProvider } from "@/features/preferences/ThemeProvider";
import { router } from "@/routes/router";
import { queryClient } from "@/services/queryClient";

export default function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <RouterProvider router={router} />
        </ToastProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
