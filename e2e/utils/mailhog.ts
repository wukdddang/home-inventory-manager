const MAILHOG_API = "http://localhost:8025/api";

interface MailhogMessage {
  ID: string;
  From: { Relays: null; Mailbox: string; Domain: string };
  To: Array<{ Relays: null; Mailbox: string; Domain: string }>;
  Content: {
    Headers: Record<string, string[]>;
    Body: string;
  };
  Created: string;
  Raw: { From: string; To: string[]; Data: string };
}

interface MailhogSearchResult {
  total: number;
  count: number;
  start: number;
  items: MailhogMessage[];
}

/**
 * 특정 수신자에게 전송된 최신 이메일을 조회한다.
 * MailHog API를 사용하여 SMTP 로 전송된 이메일을 가로챈다.
 */
export async function getLatestMailTo(
  email: string,
  retries = 10,
  delayMs = 500
): Promise<MailhogMessage | null> {
  for (let i = 0; i < retries; i++) {
    const res = await fetch(
      `${MAILHOG_API}/v2/search?kind=to&query=${encodeURIComponent(email)}`
    );
    const data: MailhogSearchResult = await res.json();

    if (data.count > 0) {
      return data.items[0];
    }

    await new Promise((r) => setTimeout(r, delayMs));
  }

  return null;
}

/**
 * quoted-printable 디코딩: =XX → 해당 바이트, =\r\n (soft line break) 제거
 */
function decodeQuotedPrintable(str: string): string {
  return str
    .replace(/=\r?\n/g, "") // soft line break 제거
    .replace(/=([0-9A-Fa-f]{2})/g, (_, hex) =>
      String.fromCharCode(parseInt(hex, 16))
    );
}

/**
 * 이메일 본문에서 인증 링크(verify-email?token=...)를 추출한다.
 */
export function extractVerifyLink(message: MailhogMessage): string | null {
  const body = decodeQuotedPrintable(message.Content.Body);
  const match = body.match(/https?:\/\/[^\s"<>]*verify-email\?token=[^\s"<>]*/);
  return match ? match[0] : null;
}

/**
 * MailHog 의 모든 이메일을 삭제한다.
 */
export async function clearAllMails(): Promise<void> {
  await fetch(`${MAILHOG_API}/v1/messages`, { method: "DELETE" });
}
