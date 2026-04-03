import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { BackupService } from '@context/backup-context/backup.service';
import { BackupType } from '@context/backup-context/backup.types';
import * as fs from 'fs/promises';
import * as path from 'path';

jest.mock('fs/promises');
jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  createWriteStream: jest.fn(() => {
    const { PassThrough } = require('stream');
    const stream = new PassThrough();
    // 즉시 drain하여 pipeline이 완료되도록
    stream.on('data', () => {});
    return stream;
  }),
}));

const mockFs = fs as jest.Mocked<typeof fs>;

describe('BackupService', () => {
  let service: BackupService;

  const mockConfigService = {
    get: jest.fn((key: string, defaultValue?: any) => {
      const config: Record<string, any> = {
        BACKUP_ENABLED: 'true',
        BACKUP_PATH: './test-backups',
        BACKUP_MAX_RETRIES: 3,
        BACKUP_RETRY_DELAY_MS: 100,
        BACKUP_COMPRESS: 'false',
        DB_DATABASE: 'test_db',
      };
      return config[key] ?? defaultValue;
    }),
  };

  const mockQueryRunner = {
    connect: jest.fn(),
    release: jest.fn(),
    query: jest.fn(),
  };

  const mockDataSource = {
    createQueryRunner: jest.fn(() => mockQueryRunner),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BackupService,
        { provide: ConfigService, useValue: mockConfigService },
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile();

    service = module.get<BackupService>(BackupService);

    // 기본 쿼리 응답 설정
    mockQueryRunner.query.mockImplementation((sql: string) => {
      if (sql.includes('pg_type')) return Promise.resolve([]); // ENUM
      if (sql.includes('pg_tables')) return Promise.resolve([{ tablename: 'users' }]);
      if (sql.includes('information_schema.columns'))
        return Promise.resolve([
          {
            column_name: 'id',
            data_type: 'integer',
            udt_name: 'int4',
            character_maximum_length: null,
            is_nullable: 'NO',
            column_default: "nextval('users_id_seq'::regclass)",
          },
          {
            column_name: 'name',
            data_type: 'character varying',
            udt_name: 'varchar',
            character_maximum_length: 255,
            is_nullable: 'YES',
            column_default: null,
          },
        ]);
      if (sql.includes('SELECT * FROM'))
        return Promise.resolve([{ id: 1, name: '테스트' }]);
      if (sql.includes('information_schema.sequences'))
        return Promise.resolve([{ sequence_name: 'users_id_seq' }]);
      return Promise.resolve([]);
    });

    mockFs.access.mockRejectedValue(new Error('ENOENT'));
    mockFs.mkdir.mockResolvedValue(undefined);
    mockFs.writeFile.mockResolvedValue(undefined);
    mockFs.stat.mockResolvedValue({ size: 500 } as any);
  });

  describe('백업생성한다', () => {
    it('백업이 비활성화된 경우 실패 결과를 반환해야 한다', async () => {
      // 비활성화된 ConfigService로 새 인스턴스 생성
      const disabledConfig = {
        get: jest.fn((key: string, defaultValue?: any) => {
          if (key === 'BACKUP_ENABLED') return 'false';
          return mockConfigService.get(key, defaultValue);
        }),
      };

      const module = await Test.createTestingModule({
        providers: [
          BackupService,
          { provide: ConfigService, useValue: disabledConfig },
          { provide: DataSource, useValue: mockDataSource },
        ],
      }).compile();

      const disabledService = module.get<BackupService>(BackupService);
      const result = await disabledService.백업생성한다(BackupType.DAILY);

      expect(result.success).toBe(false);
      expect(result.error).toBe('백업이 비활성화되어 있습니다.');
    });

    it('비압축 백업을 성공적으로 생성해야 한다', async () => {
      const result = await service.백업생성한다(BackupType.DAILY);

      expect(result.success).toBe(true);
      expect(result.type).toBe(BackupType.DAILY);
      expect(result.filename).toMatch(/^backup_daily_\d{8}_\d{6}\.sql$/);
      expect(result.size).toBeGreaterThan(0);
      expect(mockFs.writeFile).toHaveBeenCalled();
    });

    it('백업 디렉토리가 없으면 생성해야 한다', async () => {
      await service.백업생성한다(BackupType.WEEKLY);

      expect(mockFs.mkdir).toHaveBeenCalledWith(
        expect.stringContaining('weekly'),
        { recursive: true },
      );
    });

    it('SQL 백업에 헤더, 테이블 스키마, 데이터, 시퀀스가 포함되어야 한다', async () => {
      await service.백업생성한다(BackupType.DAILY);

      const writtenContent = mockFs.writeFile.mock.calls[0][1] as string;
      expect(writtenContent).toContain('-- PostgreSQL Database Backup');
      expect(writtenContent).toContain('-- Table: users');
      expect(writtenContent).toContain('CREATE TABLE "users"');
      expect(writtenContent).toContain('INSERT INTO "users"');
      expect(writtenContent).toContain('-- Reset sequences');
    });

    it('ENUM 타입이 있으면 백업에 포함되어야 한다', async () => {
      mockQueryRunner.query.mockImplementation((sql: string) => {
        if (sql.includes('pg_type'))
          return Promise.resolve([
            { enum_name: 'role_type', enum_value: 'admin', sort_order: 1 },
            { enum_name: 'role_type', enum_value: 'member', sort_order: 2 },
          ]);
        if (sql.includes('pg_tables')) return Promise.resolve([]);
        if (sql.includes('information_schema.sequences'))
          return Promise.resolve([]);
        return Promise.resolve([]);
      });

      await service.백업생성한다(BackupType.DAILY);

      const writtenContent = mockFs.writeFile.mock.calls[0][1] as string;
      expect(writtenContent).toContain('-- ENUM Types');
      expect(writtenContent).toContain('CREATE TYPE "role_type" AS ENUM');
    });

    it('SQL 생성 실패 시 재시도 후 에러를 반환해야 한다', async () => {
      mockQueryRunner.connect.mockRejectedValue(new Error('Connection failed'));

      const result = await service.백업생성한다(BackupType.DAILY);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Connection failed');
    });

    it('각 백업 타입에 맞는 파일명을 생성해야 한다', async () => {
      for (const type of [BackupType.FOUR_HOURLY, BackupType.MONTHLY, BackupType.YEARLY]) {
        jest.clearAllMocks();
        mockFs.access.mockRejectedValue(new Error('ENOENT'));
        mockFs.mkdir.mockResolvedValue(undefined);
        mockFs.writeFile.mockResolvedValue(undefined);

        const result = await service.백업생성한다(type);
        expect(result.filename).toContain(`backup_${type}_`);
      }
    });
  });

  describe('설정조회한다', () => {
    it('백업 설정을 반환해야 한다', () => {
      const config = service.설정조회한다();

      expect(config.enabled).toBe(true);
      expect(config.path).toBe('./test-backups');
      expect(config.compress).toBe(false);
      expect(config.maxRetries).toBe(3);
    });
  });
});
