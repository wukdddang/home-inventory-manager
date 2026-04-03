/// <reference lib="webworker" />

const CACHE_NAME = "him-v1";
const PRECACHE_URLS = ["/manifest.json", "/icons/icon.svg"];

// 설치 — 기본 에셋 캐시
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting()),
  );
});

// 활성화 — 이전 캐시 정리
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

// 네트워크 우선, 실패 시 캐시 폴백
self.addEventListener("fetch", (event) => {
  // API 요청은 캐시하지 않음
  if (event.request.url.includes("/api/")) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // 성공 응답이면 캐시에 저장
        if (response.ok && event.request.method === "GET") {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, clone);
          });
        }
        return response;
      })
      .catch(() => caches.match(event.request)),
  );
});

// 푸시 알림 수신
self.addEventListener("push", (event) => {
  const data = event.data?.json() ?? {};
  const title = data.title ?? "집비치기";
  const options = {
    body: data.body ?? "새로운 알림이 있습니다.",
    icon: "/icons/icon.svg",
    badge: "/icons/icon.svg",
    tag: data.tag ?? "him-notification",
    data: { url: data.url ?? "/mock/dashboard" },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// 알림 클릭 → 앱으로 이동
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? "/";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clients) => {
        const existing = clients.find((c) => c.url.includes(url));
        if (existing) return existing.focus();
        return self.clients.openWindow(url);
      }),
  );
});
