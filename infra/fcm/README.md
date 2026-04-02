# FCM (Firebase Cloud Messaging) 모바일 푸시 알림

모바일 환경에서 FCM 토큰을 발급·등록하여 유통기한 임박, 장보기 제안 등의 알림을 푸시로 전달한다.

---

## 전체 흐름

```
┌─────────────┐    ① FCM 토큰 발급     ┌──────────────────┐
│  모바일 PWA  │ ──────────────────────▶ │  Firebase Cloud  │
│  (브라우저)  │ ◀────────────────────── │   Messaging      │
└──────┬──────┘    토큰 반환            └──────────────────┘
       │
       │ ② 토큰 등록 (POST /api/fcm-tokens)
       ▼
┌──────────────┐    ③ 알림 발송         ┌──────────────────┐
│   Backend    │ ──────────────────────▶ │  FCM HTTP v1 API │
│   (NestJS)   │                        └──────────────────┘
└──────────────┘                                │
                                                ▼
                                        ┌──────────────┐
                                        │  모바일 기기  │
                                        │  푸시 알림    │
                                        └──────────────┘
```

### 단계별 설명

1. **토큰 발급**: 모바일 브라우저(PWA)에서 `Notification.requestPermission()` → Firebase SDK의 `getToken()` 호출
2. **토큰 등록**: 발급받은 토큰을 백엔드 API로 전송하여 사용자·기기 매핑 저장
3. **알림 발송**: 백엔드 스케줄러/이벤트에서 FCM HTTP v1 API를 통해 푸시 전송

---

## Firebase 프로젝트 설정

### 1. Firebase 프로젝트 생성

1. [Firebase Console](https://console.firebase.google.com) 접속
2. **프로젝트 추가** → 프로젝트 이름: `home-inventory-manager` (또는 원하는 이름)
3. Google Analytics는 선택 사항 (알림 전용이면 OFF 가능)

### 2. 웹 앱 등록

1. 프로젝트 설정 → **앱 추가** → **웹(</>)** 선택
2. 앱 닉네임: `him-web`
3. Firebase Hosting 체크 해제 (Vercel 사용)
4. **앱 등록** 후 표시되는 설정값을 환경변수로 저장:

```env
# frontend/.env.local
NEXT_PUBLIC_FIREBASE_API_KEY=<apiKey>
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=<authDomain>
NEXT_PUBLIC_FIREBASE_PROJECT_ID=<projectId>
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=<messagingSenderId>
NEXT_PUBLIC_FIREBASE_APP_ID=<appId>
```

### 3. Cloud Messaging 설정

1. 프로젝트 설정 → **Cloud Messaging** 탭
2. **Web Push certificates** 섹션에서 **키 쌍 생성** 클릭
3. 생성된 VAPID 키를 환경변수로 저장:

```env
# frontend/.env.local (추가)
NEXT_PUBLIC_FIREBASE_VAPID_KEY=<vapidKey>
```

### 4. 서비스 계정 키 (백엔드용)

1. 프로젝트 설정 → **서비스 계정** 탭
2. **새 비공개 키 생성** → JSON 파일 다운로드
3. 미니 PC 서버에 안전하게 배치:

```env
# backend/.env
FIREBASE_SERVICE_ACCOUNT_PATH=/etc/him/firebase-service-account.json
# 또는 JSON 문자열로 직접 전달
FIREBASE_SERVICE_ACCOUNT_JSON='{ ... }'
```

> **보안 주의**: 서비스 계정 키는 절대 Git에 커밋하지 않는다. `.gitignore`에 `*service-account*.json` 추가 필수.

---

## 프론트엔드 구현 가이드

### 1. Firebase SDK 설치

```bash
cd frontend
pnpm add firebase
```

### 2. Firebase 초기화 (`lib/firebase.ts`)

```typescript
import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);

// messaging은 브라우저 환경에서만 초기화
export const messaging =
  typeof window !== 'undefined' ? getMessaging(app) : null;
```

### 3. FCM 토큰 발급 및 등록

```typescript
import { getToken } from 'firebase/messaging';
import { messaging } from '@/lib/firebase';

export async function FCM토큰을_발급하고_등록한다(): Promise<string | null> {
  if (!messaging) return null;

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    console.warn('알림 권한이 거부되었습니다.');
    return null;
  }

  const token = await getToken(messaging, {
    vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
  });

  // 백엔드에 토큰 등록
  await fetch('/api/fcm-tokens', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  });

  return token;
}
```

### 4. Service Worker (`public/firebase-messaging-sw.js`)

백그라운드 알림 수신을 위해 Service Worker가 필요하다:

```javascript
importScripts(
  'https://www.gstatic.com/firebasejs/11.x.x/firebase-app-compat.js'
);
importScripts(
  'https://www.gstatic.com/firebasejs/11.x.x/firebase-messaging-compat.js'
);

firebase.initializeApp({
  apiKey: '...',
  authDomain: '...',
  projectId: '...',
  messagingSenderId: '...',
  appId: '...',
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const { title, body } = payload.notification;
  self.registration.showNotification(title, {
    body,
    icon: '/icons/icon-192x192.png',
  });
});
```

> Service Worker에서는 `process.env`를 사용할 수 없으므로 빌드 시 값을 주입하거나 하드코딩해야 한다.

### 5. 토큰 갱신 처리

FCM 토큰은 주기적으로 만료될 수 있다. `onMessage` 콜백에서 토큰 갱신을 감지하고 백엔드에 업데이트해야 한다:

```typescript
import { onMessage } from 'firebase/messaging';

if (messaging) {
  onMessage(messaging, (payload) => {
    // 포그라운드 알림 처리 (sonner 토스트 등)
    console.log('포그라운드 메시지:', payload);
  });
}
```

---

## 백엔드 구현 가이드

### 1. Firebase Admin SDK 설치

```bash
cd backend
pnpm add firebase-admin
```

### 2. FCM 토큰 저장 엔티티

```
FcmToken
├── id: UUID (PK)
├── userId: UUID (FK → User)
├── token: string (unique)
├── deviceInfo: string (nullable) — User-Agent 등
├── createdAt: timestamp
└── updatedAt: timestamp
```

### 3. API 엔드포인트

| 메서드 | 경로 | 설명 |
|--------|------|------|
| `POST` | `/api/fcm-tokens` | 토큰 등록 (upsert) |
| `DELETE` | `/api/fcm-tokens/:token` | 토큰 삭제 (로그아웃 시) |
| `GET` | `/api/fcm-tokens` | 내 토큰 목록 조회 |

### 4. 알림 발송 서비스

```typescript
import * as admin from 'firebase-admin';

@Injectable()
export class FcmService {
  constructor() {
    admin.initializeApp({
      credential: admin.credential.cert(
        process.env.FIREBASE_SERVICE_ACCOUNT_PATH
      ),
    });
  }

  async 알림을_전송한다(token: string, title: string, body: string) {
    return admin.messaging().send({
      token,
      notification: { title, body },
      webpush: {
        fcmOptions: { link: 'https://him.example.com' },
      },
    });
  }

  async 다수에게_알림을_전송한다(tokens: string[], title: string, body: string) {
    return admin.messaging().sendEachForMulticast({
      tokens,
      notification: { title, body },
    });
  }
}
```

---

## 알림 연동 시나리오

기존 알림 기능(`NotificationPreference`)과 연동하여 다음 상황에서 푸시를 발송한다:

| 시나리오 | 트리거 | 알림 내용 예시 |
|----------|--------|----------------|
| 유통기한 임박 | 스케줄러 (매일 09:00) | "우유 유통기한이 2일 남았습니다" |
| 재고 부족 | 재고 변경 이벤트 | "계란이 2개 남았습니다 (최소: 6개)" |
| 장보기 제안 | 스케줄러 (매주 월요일) | "이번 주 장보기 목록이 준비되었습니다" |
| 거점 초대 | 초대 생성 이벤트 | "홍길동님이 '우리집'에 초대했습니다" |

---

## 환경변수 요약

### 프론트엔드 (`frontend/.env.local`)

| 변수명 | 설명 | 필수 |
|--------|------|------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase API 키 | O |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase Auth 도메인 | O |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase 프로젝트 ID | O |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | FCM 발신자 ID | O |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Firebase 앱 ID | O |
| `NEXT_PUBLIC_FIREBASE_VAPID_KEY` | Web Push VAPID 키 | O |

### 백엔드 (`backend/.env`)

| 변수명 | 설명 | 필수 |
|--------|------|------|
| `FIREBASE_SERVICE_ACCOUNT_PATH` | 서비스 계정 JSON 파일 경로 | △ |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | 서비스 계정 JSON 문자열 | △ |

> `PATH`와 `JSON` 중 하나만 설정하면 된다.

---

## 체크리스트

- [ ] Firebase 프로젝트 생성 및 웹 앱 등록
- [ ] Cloud Messaging VAPID 키 발급
- [ ] 서비스 계정 키 생성 및 서버 배치
- [ ] 프론트엔드 Firebase SDK 설치 및 초기화
- [ ] Service Worker 작성 (`firebase-messaging-sw.js`)
- [ ] FCM 토큰 발급 로직 구현
- [ ] 백엔드 FCM 토큰 CRUD API 구현
- [ ] 백엔드 알림 발송 서비스 구현
- [ ] 기존 알림 스케줄러와 FCM 연동
- [ ] `.gitignore`에 서비스 계정 키 파일 패턴 추가
- [ ] Vercel 환경변수 등록 (프론트엔드)
- [ ] 미니 PC 환경변수 등록 (백엔드)
