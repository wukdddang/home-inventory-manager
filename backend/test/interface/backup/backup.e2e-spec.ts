import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { BackupService } from '@context/backup-context/backup.service';
import { BackupRetentionService } from '@context/backup-context/backup-retention.service';
import { BackupScheduler } from '@context/backup-context/backup.scheduler';
import { BackupType, BACKUP_RETENTION } from '@context/backup-context/backup.types';

describe('BackupContext E2E', () => {
  let postgresContainer: StartedPostgreSqlContainer;
  let dataSource: DataSource;
  let backupService: BackupService;
  let retentionService: BackupRetentionService;
  let scheduler: BackupScheduler;
  let testBackupPath: string;

  beforeAll(async () => {
    // 1. PostgreSQL 테스트 컨테이너 시작
    postgresContainer = await new PostgreSqlContainer('postgres:16-alpine')
      .withDatabase('him_backup_test')
      .withUsername('test_user')
      .withPassword('test_password')
      .withExposedPorts(5432)
      .start();

    const url = new URL(postgresContainer.getConnectionUri());

    // 2. 임시 백업 디렉토리
    testBackupPath = path.join(os.tmpdir(), `him-backup-test-${Date.now()}`);

    // 3. TypeORM DataSource 직접 생성
    dataSource = new DataSource({
      type: 'postgres',
      host: url.hostname,
      port: parseInt(url.port),
      username: url.username,
      password: url.password,
      database: url.pathname.replace('/', ''),
      synchronize: false,
    });

    await dataSource.initialize();

    // 4. 테스트 테이블 생성
    await dataSource.query(`
      CREATE TYPE test_role AS ENUM ('admin', 'member');
    `);
    await dataSource.query(`
      CREATE TABLE test_users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        role test_role DEFAULT 'member',
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    await dataSource.query(`
      INSERT INTO test_users (name, email, role) VALUES
        ('홍길동', 'hong@test.com', 'admin'),
        ('김철수', 'kim@test.com', 'member'),
        ('이영희', NULL, 'member');
    `);

    // 5. ConfigService 설정
    const configService = {
      get: jest.fn((key: string, defaultValue?: any) => {
        const config: Record<string, any> = {
          BACKUP_ENABLED: 'true',
          BACKUP_PATH: testBackupPath,
          BACKUP_MAX_RETRIES: 3,
          BACKUP_RETRY_DELAY_MS: 100,
          BACKUP_COMPRESS: 'true',
          DB_DATABASE: 'him_backup_test',
        };
        return config[key] ?? defaultValue;
      }),
    };

    // 6. 서비스 인스턴스 생성
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BackupService,
        BackupRetentionService,
        BackupScheduler,
        { provide: ConfigService, useValue: configService },
        { provide: DataSource, useValue: dataSource },
      ],
    }).compile();

    backupService = module.get<BackupService>(BackupService);
    retentionService = module.get<BackupRetentionService>(
      BackupRetentionService,
    );
    scheduler = module.get<BackupScheduler>(BackupScheduler);
  }, 60000);

  afterAll(async () => {
    if (dataSource?.isInitialized) {
      await dataSource.destroy();
    }
    if (postgresContainer) {
      await postgresContainer.stop();
    }
    // 임시 디렉토리 정리
    try {
      await fs.rm(testBackupPath, { recursive: true, force: true });
    } catch {
      // 무시
    }
  });

  describe('BackupService — 실제 DB 백업', () => {
    it('gzip 압축된 백업 파일을 생성해야 한다', async () => {
      const result = await backupService.백업생성한다(BackupType.DAILY);

      expect(result.success).toBe(true);
      expect(result.filename).toMatch(/\.sql\.gz$/);
      expect(result.size).toBeGreaterThan(0);
      expect(result.originalSize).toBeGreaterThan(result.size);
      expect(result.compressionRatio).toBeGreaterThan(0);

      // 파일이 실제로 존재하는지 확인
      const fileStat = await fs.stat(result.path);
      expect(fileStat.size).toBe(result.size);
    });

    it('백업 SQL에 테이블 스키마와 데이터가 포함되어야 한다', async () => {
      // 비압축 모드로 테스트하기 위해 새 서비스 생성
      const uncompressedConfig = {
        get: jest.fn((key: string, defaultValue?: any) => {
          const config: Record<string, any> = {
            BACKUP_ENABLED: 'true',
            BACKUP_PATH: testBackupPath,
            BACKUP_MAX_RETRIES: 3,
            BACKUP_RETRY_DELAY_MS: 100,
            BACKUP_COMPRESS: 'false',
            DB_DATABASE: 'him_backup_test',
          };
          return config[key] ?? defaultValue;
        }),
      };

      const module = await Test.createTestingModule({
        providers: [
          BackupService,
          { provide: ConfigService, useValue: uncompressedConfig },
          { provide: DataSource, useValue: dataSource },
        ],
      }).compile();

      const uncompressedService = module.get<BackupService>(BackupService);
      const result = await uncompressedService.백업생성한다(
        BackupType.FOUR_HOURLY,
      );

      expect(result.success).toBe(true);
      expect(result.filename).toMatch(/\.sql$/);

      // SQL 내용 검증
      const sqlContent = await fs.readFile(result.path, 'utf8');
      expect(sqlContent).toContain('-- PostgreSQL Database Backup');
      expect(sqlContent).toContain('CREATE TABLE "test_users"');
      expect(sqlContent).toContain('INSERT INTO "test_users"');
      expect(sqlContent).toContain("'홍길동'");
      expect(sqlContent).toContain("'kim@test.com'");
      // ENUM 타입 백업 확인
      expect(sqlContent).toContain('CREATE TYPE "test_role" AS ENUM');
      expect(sqlContent).toContain("'admin'");
      expect(sqlContent).toContain("'member'");
      // NULL 값 처리
      expect(sqlContent).toContain('NULL');
    });

    it('여러 타입의 백업을 순차적으로 생성할 수 있어야 한다', async () => {
      const types = [BackupType.WEEKLY, BackupType.MONTHLY];

      for (const type of types) {
        const result = await backupService.백업생성한다(type);
        expect(result.success).toBe(true);

        // 각 타입별 디렉토리에 파일이 생성되었는지 확인
        const dir = path.join(testBackupPath, type);
        const files = await fs.readdir(dir);
        expect(files.length).toBeGreaterThanOrEqual(1);
      }
    });
  });

  describe('BackupRetentionService — 실제 파일 보관 정책', () => {
    it('만료된 백업 파일을 삭제해야 한다', async () => {
      // 만료된 파일 수동 생성
      const expiredDir = path.join(testBackupPath, BackupType.QUARTERLY);
      await fs.mkdir(expiredDir, { recursive: true });
      const expiredFile = path.join(
        expiredDir,
        'backup_quarterly_20200101_030000.sql.gz',
      );
      await fs.writeFile(expiredFile, 'expired-backup-content');

      // mtime을 과거로 설정 (보관 기간 초과)
      const expiredDate = new Date(
        Date.now() - BACKUP_RETENTION[BackupType.QUARTERLY] - 86400000,
      );
      await fs.utimes(expiredFile, expiredDate, expiredDate);

      const result = await retentionService.타입별보관정책적용한다(
        BackupType.QUARTERLY,
      );

      expect(result.deleted).toBeGreaterThanOrEqual(1);

      // 파일이 실제로 삭제되었는지 확인
      await expect(fs.access(expiredFile)).rejects.toThrow();
    });

    it('백업 목록을 조회하고 통계를 반환해야 한다', async () => {
      // 이전 테스트에서 생성된 파일들을 조회
      const backups = await retentionService.백업목록조회한다();
      expect(backups.length).toBeGreaterThanOrEqual(1);
      expect(backups[0]).toHaveProperty('type');
      expect(backups[0]).toHaveProperty('filename');
      expect(backups[0]).toHaveProperty('createdAt');
      expect(backups[0]).toHaveProperty('expiresAt');

      const stats = await retentionService.통계조회한다();
      expect(stats.total.count).toBeGreaterThanOrEqual(1);
      expect(stats.total.totalSize).toBeGreaterThan(0);
    });
  });

  describe('BackupScheduler — 전체 흐름 통합', () => {
    it('스케줄러가 백업 생성 → 보관 정책 적용까지 수행해야 한다', async () => {
      // dailyBackup 호출 (실제 DB 백업 + 실제 파일 생성 + 실제 정리)
      await scheduler.dailyBackup();

      // daily 디렉토리에 파일이 존재하는지 확인
      const dailyDir = path.join(testBackupPath, BackupType.DAILY);
      const files = await fs.readdir(dailyDir);
      const dailyFiles = files.filter((f) => f.startsWith('backup_daily_'));
      expect(dailyFiles.length).toBeGreaterThanOrEqual(1);
    });

    it('cleanupExpiredBackups가 정상적으로 동작해야 한다', async () => {
      await expect(
        scheduler.cleanupExpiredBackups(),
      ).resolves.not.toThrow();
    });
  });
});
