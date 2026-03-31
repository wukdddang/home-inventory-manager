"use client";

import {
  getAuthUserSnapshot,
  setAuthUser,
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
import { useEffect, useRef, useState, useSyncExternalStore } from "react";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const user = useSyncExternalStore(
    subscribeAuthUser,
    getAuthUserSnapshot,
    () => null,
  );
  const [verified, setVerified] = useState(false);
  const verifyAttempted = useRef(false);

  useEffect(() => {
    if (verifyAttempted.current) return;
    verifyAttempted.current = true;

    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setAuthUser({
            email: data.data.email,
            displayName: data.data.displayName,
            emailVerified: !!data.data.emailVerifiedAt,
          });
          setVerified(true);
        } else {
          setAuthUser(null);
          router.replace("/login");
        }
      })
      .catch(() => {
        setAuthUser(null);
        router.replace("/login");
      });
  }, [router]);

  // localStorage에 유저가 없고 검증도 안 됐으면 로딩
  // 검증 실패 시 위 effect에서 리다이렉트 처리
  const showChildren = verified && user !== null;

  return (
    <AnimatePresence mode="wait">
      {showChildren ? (
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
