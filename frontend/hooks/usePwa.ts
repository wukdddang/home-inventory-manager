"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/* ------------------------------------------------------------------ */
/*  Service Worker 등록                                                */
/* ------------------------------------------------------------------ */

export function useServiceWorker() {
  const [registration, setRegistration] =
    useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator))
      return;

    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => {
        setRegistration(reg);
        console.log("[SW] 등록 완료:", reg.scope);
      })
      .catch((err) => console.error("[SW] 등록 실패:", err));
  }, []);

  return registration;
}

/* ------------------------------------------------------------------ */
/*  PWA 설치 프롬프트 관리                                              */
/* ------------------------------------------------------------------ */

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

type PwaInstallState = "idle" | "installable" | "installed" | "dismissed";

const DISMISS_KEY = "him-pwa-install-dismissed";
const DISMISS_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7일

function isDismissedRecently(): boolean {
  try {
    const ts = localStorage.getItem(DISMISS_KEY);
    if (!ts) return false;
    return Date.now() - Number(ts) < DISMISS_DURATION_MS;
  } catch {
    return false;
  }
}

export function usePwaInstall() {
  const deferredPrompt = useRef<BeforeInstallPromptEvent | null>(null);
  const [state, setState] = useState<PwaInstallState>("idle");

  useEffect(() => {
    // 이미 standalone으로 실행 중이면 installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setState("installed");
      return;
    }

    // 이전에 닫은 지 7일 미만이면 표시 안 함
    if (isDismissedRecently()) {
      setState("dismissed");
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      deferredPrompt.current = e as BeforeInstallPromptEvent;
      setState("installable");
    };

    const installedHandler = () => setState("installed");

    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", installedHandler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", installedHandler);
    };
  }, []);

  const 설치를_요청한다 = useCallback(async () => {
    const prompt = deferredPrompt.current;
    if (!prompt) return false;

    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    deferredPrompt.current = null;

    if (outcome === "accepted") {
      setState("installed");
      return true;
    }
    setState("dismissed");
    return false;
  }, []);

  const 나중에_설치한다 = useCallback(() => {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      // localStorage 접근 불가 시 무시
    }
    setState("dismissed");
  }, []);

  return { state, 설치를_요청한다, 나중에_설치한다 };
}

/* ------------------------------------------------------------------ */
/*  푸시 토큰 관리 (mock)                                              */
/* ------------------------------------------------------------------ */

const TOKEN_KEY = "him-push-token";

export type PushTokenState = {
  token: string | null;
  loading: boolean;
  granted: boolean;
};

export function usePushToken() {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [granted, setGranted] = useState(false);

  // 초기화: 저장된 토큰 복원
  useEffect(() => {
    const saved = localStorage.getItem(TOKEN_KEY);
    if (saved) {
      setToken(saved);
      setGranted(true);
    }
    if ("Notification" in window) {
      setGranted(Notification.permission === "granted");
    }
  }, []);

  const 토큰을_발급한다 = useCallback(async (): Promise<string | null> => {
    setLoading(true);
    try {
      if (!("Notification" in window)) {
        // Notification API 미지원 → mock 토큰
        const mockToken = `him_push_${crypto.randomUUID().slice(0, 12)}`;
        localStorage.setItem(TOKEN_KEY, mockToken);
        setToken(mockToken);
        setGranted(true);
        return mockToken;
      }

      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setGranted(false);
        return null;
      }

      // mock 토큰 생성 (실제로는 FCM getToken 호출)
      const mockToken = `him_push_${crypto.randomUUID().slice(0, 12)}`;
      localStorage.setItem(TOKEN_KEY, mockToken);
      setToken(mockToken);
      setGranted(true);
      console.log("[Push] 토큰 발급:", mockToken);
      return mockToken;
    } finally {
      setLoading(false);
    }
  }, []);

  const 토큰을_삭제한다 = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    console.log("[Push] 토큰 삭제");
  }, []);

  return { token, loading, granted, 토큰을_발급한다, 토큰을_삭제한다 };
}
