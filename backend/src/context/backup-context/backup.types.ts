/**
 * 백업 타입 정의
 */

export enum BackupType {
  FOUR_HOURLY = 'four_hourly', // 4시간 백업
  DAILY = 'daily', // 일간 백업
  WEEKLY = 'weekly', // 주간 백업
  MONTHLY = 'monthly', // 월간 백업
  QUARTERLY = 'quarterly', // 분기 백업
  YEARLY = 'yearly', // 연간 백업
}

/**
 * 백업 보관 기간 (밀리초)
 *
 * GFS 백업 전략에 따른 보관 기간 (infra/README.md 기준):
 * - 4시간 백업: 7일 보관 (하루 6개 × 7일 = 최대 42개)
 * - 일간 백업: 30일 보관 (하루 1개 × 30일 = 최대 30개)
 * - 주간 백업: 90일 보관 (주 1개 × ~13주 = 최대 13개)
 * - 월간 백업: 365일 보관 (월 1개 × 12개월 = 최대 12개)
 * - 분기 백업: 730일 보관 (분기 1개 × 8분기 = 최대 8개)
 * - 연간 백업: 1825일 보관 (연 1개 × 5년 = 최대 5개)
 *
 * 총 최대 파일 개수: 약 110개
 */
export const BACKUP_RETENTION: Record<BackupType, number> = {
  [BackupType.FOUR_HOURLY]: 7 * 24 * 60 * 60 * 1000, // 7일
  [BackupType.DAILY]: 30 * 24 * 60 * 60 * 1000, // 30일
  [BackupType.WEEKLY]: 90 * 24 * 60 * 60 * 1000, // 90일
  [BackupType.MONTHLY]: 365 * 24 * 60 * 60 * 1000, // 1년
  [BackupType.QUARTERLY]: 730 * 24 * 60 * 60 * 1000, // 2년
  [BackupType.YEARLY]: 1825 * 24 * 60 * 60 * 1000, // 5년
};

/**
 * 백업 설정
 */
export interface BackupConfig {
  enabled: boolean;
  path: string;
  maxRetries: number;
  retryDelayMs: number;
  compress: boolean;
}

/**
 * 백업 결과
 */
export interface BackupResult {
  success: boolean;
  type: BackupType;
  filename: string;
  path: string;
  size: number;
  originalSize?: number;
  compressionRatio?: number;
  timestamp: Date;
  error?: string;
}

/**
 * 백업 메타데이터
 */
export interface BackupMetadata {
  type: BackupType;
  filename: string;
  createdAt: Date;
  expiresAt: Date;
}
