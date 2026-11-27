import { QueryClientProvider } from "@tanstack/react-query";
import { LazyMotion, MotionConfig } from "motion/react";
import { RouterProvider } from "react-router";
import { ToastProvider } from "@/components/ui";
import { ThemeProvider } from "@/features/preferences/ThemeProvider";
import { router } from "@/routes/router";
import { queryClient } from "@/services/queryClient";

const loadMotionFeatures = () => import("@/motion/features").then((mod) => mod.default);

export default function App() {
  return (
    // reducedMotion="user": Motion drops transform animations (keeps fades) when the OS
    // asks for reduced motion. CSS and GSAP honour the same setting on their side.
    <LazyMotion features={loadMotionFeatures} strict>
      <MotionConfig reducedMotion="user">
        <ThemeProvider>
          <QueryClientProvider client={queryClient}>
            <ToastProvider>
              <RouterProvider router={router} />
            </ToastProvider>
          </QueryClientProvider>
        </ThemeProvider>
      </MotionConfig>
    </LazyMotion>
  );
}
