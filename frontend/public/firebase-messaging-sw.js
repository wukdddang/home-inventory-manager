/* eslint-disable no-undef */
/**
 * Firebase Cloud Messaging 서비스 워커.
 * 백그라운드 푸시 알림을 수신하여 표시한다.
 */

importScripts(
  "https://www.gstatic.com/firebasejs/11.8.1/firebase-app-compat.js",
);
importScripts(
  "https://www.gstatic.com/firebasejs/11.8.1/firebase-messaging-compat.js",
);

// 서비스 워커에서는 process.env를 사용할 수 없으므로 Firebase config를 직접 기입한다.
// Firebase 웹 앱 config는 클라이언트 공개 값이므로 코드에 포함해도 무방하다.
firebase.initializeApp({
  apiKey: "AIzaSyCLBac9W9Aj5aNoLcF4bn-0Xd4Sy4gBOzI",
  authDomain: "home-inventory-manager-a7cd5.firebaseapp.com",
  projectId: "home-inventory-manager-a7cd5",
  messagingSenderId: "946163384428",
  appId: "1:946163384428:web:69700fe854a75c49805849",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const { title, body } = payload.notification ?? {};
  if (!title) return;

  self.registration.showNotification(title, {
    body: body ?? "",
    icon: "/icons/icon.svg",
    badge: "/icons/icon.svg",
    data: payload.data,
  });
});
