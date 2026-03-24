"use client";

import { useAppRoutePrefix } from "@/lib/use-app-route-prefix";
import {
  getAuthUserSnapshot,
  subscribeAuthUser,
} from "@/lib/local-store";
import { AppLoadingState } from "@/app/_ui/app-loading-state";
import {
  appViewPresenceSoftTransition,
  appViewPresenceSoftVariants,
  appViewPresenceTransition,
  appViewPresenceVariants,
} from "@/app/_ui/app-view-transition.motion";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect, useSyncExternalStore } from "react";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const prefix = useAppRoutePrefix();
  const user = useSyncExternalStore(
    subscribeAuthUser,
    getAuthUserSnapshot,
    () => null,
  );

  useEffect(() => {
    if (user === null) router.replace(`${prefix}/login`);
  }, [user, router, prefix]);

  return (
    <AnimatePresence mode="wait">
      {user ? (
        <motion.div
          key="auth-children"
          className="flex h-full min-h-0 w-full flex-1 flex-col"
          initial="initial"
          animate="animate"
          exit="exit"
          variants={appViewPresenceSoftVariants}
          transition={appViewPresenceSoftTransition}
        >
          {children}
        </motion.div>
      ) : (
        <motion.div
          key="auth-loading"
          className="flex h-full min-h-0 w-full flex-1 flex-col items-center justify-center bg-zinc-950 px-4 text-zinc-300"
          initial="initial"
          animate="animate"
          exit="exit"
          variants={appViewPresenceVariants}
          transition={appViewPresenceTransition}
        >
          <AppLoadingState
            message="불러오는 중…"
            layout="standalone"
            className="py-0"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
