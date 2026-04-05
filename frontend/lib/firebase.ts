import { initializeApp, getApps } from "firebase/app";
import { getMessaging, getToken, isSupported } from "firebase/messaging";

/**
 * Firebase 웹 앱 설정.
 * 환경변수로 주입하거나, Firebase Console > 프로젝트 설정 > 일반 에서 확인.
 */
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

/** VAPID 키 (Firebase Console > Cloud Messaging > Web Push certificates) */
const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

/** Firebase 앱 인스턴스 (중복 초기화 방지) */
export function getFirebaseApp() {
  if (getApps().length > 0) return getApps()[0];
  return initializeApp(firebaseConfig);
}

/**
 * FCM 토큰을 발급받는다.
 * - 브라우저가 Notification API를 지원해야 한다.
 * - firebase-messaging-sw.js 서비스 워커가 등록되어 있어야 한다.
 * - VAPID 키가 설정되어 있어야 한다.
 *
 * @returns FCM 토큰 문자열, 또는 지원하지 않는 환경이면 null
 */
export async function requestFcmToken(): Promise<string | null> {
  const supported = await isSupported();
  if (!supported) {
    console.warn("이 브라우저는 Firebase Messaging을 지원하지 않습니다.");
    return null;
  }

  if (!vapidKey) {
    console.warn("NEXT_PUBLIC_FIREBASE_VAPID_KEY가 설정되지 않았습니다.");
    return null;
  }

  const app = getFirebaseApp();
  const messaging = getMessaging(app);

  // 서비스 워커 등록
  const registration = await navigator.serviceWorker.register(
    "/firebase-messaging-sw.js",
  );

  const token = await getToken(messaging, {
    vapidKey,
    serviceWorkerRegistration: registration,
  });

  return token || null;
}
