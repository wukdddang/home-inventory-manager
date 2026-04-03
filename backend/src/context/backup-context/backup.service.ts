import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import * as fs from 'fs/promises';
import * as path from 'path';
import { createGzip } from 'zlib';
import { pipeline } from 'stream/promises';
import { Readable, PassThrough } from 'stream';
import { createWriteStream } from 'fs';
import { BackupType, BackupResult, BackupConfig } from './backup.types';

/**
 * 데이터베이스 백업 서비스
 *
 * TypeORM을 사용하여 데이터베이스 백업을 수행합니다.
 * pg_dump 설치 없이 순수 Node.js로 백업 생성, gzip 압축
 */
@Injectable()
export class BackupService {
  private readonly logger = new Logger(BackupService.name);
  private readonly config: BackupConfig;

  constructor(
    private readonly configService: ConfigService,
    private readonly dataSource: DataSource,
  ) {
    this.config = {
      enabled:
        this.configService.get<string>('BACKUP_ENABLED', 'false') === 'true',
      path: this.configService.get<string>(
        'BACKUP_PATH',
        './backups/database',
      ),
      maxRetries: this.configService.get<number>('BACKUP_MAX_RETRIES', 3),
      retryDelayMs: this.configService.get<number>(
        'BACKUP_RETRY_DELAY_MS',
        5000,
      ),
      compress:
        this.configService.get<string>('BACKUP_COMPRESS', 'true') === 'true',
    };
  }

  /**
   * 데이터베이스 백업을 수행합니다.
   */
  async 백업생성한다(type: BackupType): Promise<BackupResult> {
    if (!this.config.enabled) {
      this.logger.warn('백업이 비활성화되어 있습니다.');
      return {
        success: false,
        type,
        filename: '',
        path: '',
        size: 0,
        timestamp: new Date(),
        error: '백업이 비활성화되어 있습니다.',
      };
    }

    const timestamp = new Date();
    const baseFilename = this.generateFilename(type, timestamp);
    const basePath = path.join(this.config.path, type, baseFilename);

    try {
      await this.ensureBackupDirectory(type);

      const sqlContent = await this.generateSqlBackup();
      const originalSize = Buffer.byteLength(sqlContent, 'utf8');

      if (this.config.compress) {
        const finalPath = `${basePath}.gz`;
        await this.compressAndWrite(sqlContent, finalPath);

        const stats = await fs.stat(finalPath);
        const compressedSize = stats.size;
        const compressionRatio = (1 - compressedSize / originalSize) * 100;

        this.logger.log(
          `백업 성공: ${type} - ${path.basename(finalPath)} (원본: ${this.formatBytes(originalSize)}, 압축: ${this.formatBytes(compressedSize)}, 압축률: ${compressionRatio.toFixed(1)}%)`,
        );

        return {
          success: true,
          type,
          filename: path.basename(finalPath),
          path: finalPath,
          size: compressedSize,
          originalSize,
          compressionRatio,
          timestamp,
        };
      } else {
        await fs.writeFile(basePath, sqlContent, 'utf8');

        this.logger.log(
          `백업 성공: ${type} - ${baseFilename} (${this.formatBytes(originalSize)})`,
        );

        return {
          success: true,
          type,
          filename: baseFilename,
          path: basePath,
          size: originalSize,
          originalSize,
          compressionRatio: 0,
          timestamp,
        };
      }
    } catch (error: any) {
      this.logger.error(`백업 실패: ${type} - ${error.message}`, error.stack);
      return {
        success: false,
        type,
        filename: baseFilename,
        path: basePath,
        size: 0,
        timestamp,
        error: error.message,
      };
    }
  }

  /**
   * gzip 압축 후 파일에 기록합니다.
   */
  private async compressAndWrite(
    content: string,
    filePath: string,
  ): Promise<void> {
    const source = Readable.from([content]);
    const gzip = createGzip({ level: 6 });
    const destination = createWriteStream(filePath);

    await pipeline(source, gzip, destination);
  }

  /**
   * TypeORM을 사용하여 SQL 백업을 생성합니다.
   */
  private async generateSqlBackup(): Promise<string> {
    let retries = 0;

    while (retries < this.config.maxRetries) {
      try {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();

        try {
          const sqlLines: string[] = [];

          sqlLines.push('-- PostgreSQL Database Backup');
          sqlLines.push(`-- Generated at: ${new Date().toISOString()}`);
          sqlLines.push(
            `-- Database: ${this.configService.get<string>('DB_DATABASE')}`,
          );
          sqlLines.push('');
          sqlLines.push("SET client_encoding = 'UTF8';");
          sqlLines.push('SET standard_conforming_strings = on;');
          sqlLines.push('');

          // ENUM 타입 백업
          const enumTypes = await this.getEnumTypes(queryRunner);
          if (enumTypes.length > 0) {
            sqlLines.push('-- ENUM Types');
            for (const enumDef of enumTypes) {
              sqlLines.push(enumDef);
            }
            sqlLines.push('');
          }

          // 모든 테이블 목록
          const tables = await this.getAllTables(queryRunner);
          this.logger.debug(`백업할 테이블 수: ${tables.length}`);

          for (const tableName of tables) {
            this.logger.debug(`테이블 백업 중: ${tableName}`);

            const tableSchema = await this.getTableSchema(
              queryRunner,
              tableName,
            );
            sqlLines.push('');
            sqlLines.push(`-- Table: ${tableName}`);
            sqlLines.push(`DROP TABLE IF EXISTS "${tableName}" CASCADE;`);
            sqlLines.push(tableSchema);
            sqlLines.push('');

            const dataInserts = await this.getTableData(
              queryRunner,
              tableName,
            );
            if (dataInserts.length > 0) {
              sqlLines.push(`-- Data for table: ${tableName}`);
              sqlLines.push(...dataInserts);
              sqlLines.push('');
            }
          }

          // 시퀀스 재설정
          sqlLines.push('-- Reset sequences');
          const sequences = await this.getSequences(queryRunner);
          for (const seq of sequences) {
            sqlLines.push(seq);
          }

          const sqlContent = sqlLines.join('\n');
          this.logger.debug(
            `백업 SQL 생성 완료 (크기: ${this.formatBytes(Buffer.byteLength(sqlContent, 'utf8'))})`,
          );
          return sqlContent;
        } finally {
          await queryRunner.release();
        }
      } catch (error: any) {
        retries++;
        this.logger.warn(
          `백업 생성 실패 (시도 ${retries}/${this.config.maxRetries}): ${error.message}`,
        );

        if (retries >= this.config.maxRetries) {
          throw new Error(
            `백업 생성 실패: ${error.message}. 최대 재시도 횟수(${this.config.maxRetries})를 초과했습니다.`,
          );
        }

        await this.sleep(this.config.retryDelayMs);
      }
    }

    throw new Error(
      `백업 생성 실패: 최대 재시도 횟수(${this.config.maxRetries})를 초과했습니다.`,
    );
  }

  private async getEnumTypes(queryRunner: any): Promise<string[]> {
    const enums = await queryRunner.query(`
      SELECT
        t.typname as enum_name,
        e.enumlabel as enum_value,
        e.enumsortorder as sort_order
      FROM pg_type t
      JOIN pg_enum e ON t.oid = e.enumtypid
      JOIN pg_namespace n ON t.typnamespace = n.oid
      WHERE n.nspname = 'public'
      ORDER BY t.typname, e.enumsortorder
    `);

    if (enums.length === 0) return [];

    const enumsByType = new Map<string, string[]>();
    for (const row of enums) {
      if (!enumsByType.has(row.enum_name)) {
        enumsByType.set(row.enum_name, []);
      }
      enumsByType.get(row.enum_name)!.push(row.enum_value);
    }

    const enumDefs: string[] = [];
    for (const [enumName, values] of enumsByType.entries()) {
      const valueList = values
        .map((v: string) => `'${v.replace(/'/g, "''")}'`)
        .join(', ');
      enumDefs.push(`DROP TYPE IF EXISTS "${enumName}" CASCADE;`);
      enumDefs.push(`CREATE TYPE "${enumName}" AS ENUM (${valueList});`);
    }

    return enumDefs;
  }

  private async getAllTables(queryRunner: any): Promise<string[]> {
    const result = await queryRunner.query(`
      SELECT tablename
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename
    `);
    return result.map((row: any) => row.tablename);
  }

  private async getTableSchema(
    queryRunner: any,
    tableName: string,
  ): Promise<string> {
    const columns = await queryRunner.query(
      `
      SELECT
        column_name,
        data_type,
        udt_name,
        character_maximum_length,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = $1
      ORDER BY ordinal_position
    `,
      [tableName],
    );

    let createSql = `CREATE TABLE "${tableName}" (\n`;

    const columnDefs = columns.map((col: any) => {
      let dataType = col.data_type;

      if (dataType === 'USER-DEFINED') {
        dataType = col.udt_name;
      }

      let def = `  "${col.column_name}" ${dataType}`;

      if (col.character_maximum_length) {
        def += `(${col.character_maximum_length})`;
      }

      if (col.column_default) {
        def += ` DEFAULT ${col.column_default}`;
      }

      if (col.is_nullable === 'NO') {
        def += ' NOT NULL';
      }

      return def;
    });

    createSql += columnDefs.join(',\n');
    createSql += '\n);';

    return createSql;
  }

  private async getTableData(
    queryRunner: any,
    tableName: string,
  ): Promise<string[]> {
    const data = await queryRunner.query(`SELECT * FROM "${tableName}"`);

    if (data.length === 0) return [];

    const inserts: string[] = [];
    const columns = Object.keys(data[0]);

    const batchSize = 100;
    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);
      const values = batch
        .map((row: any) => {
          const vals = columns
            .map((col) => {
              const val = row[col];
              if (val === null) return 'NULL';
              if (typeof val === 'string')
                return `'${val.replace(/'/g, "''")}'`;
              if (val instanceof Date) return `'${val.toISOString()}'`;
              if (typeof val === 'boolean') return val ? 'true' : 'false';
              if (typeof val === 'object')
                return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
              return val;
            })
            .join(', ');
          return `(${vals})`;
        })
        .join(',\n  ');

      inserts.push(
        `INSERT INTO "${tableName}" (${columns.map((c) => `"${c}"`).join(', ')}) VALUES\n  ${values};`,
      );
    }

    return inserts;
  }

  private async getSequences(queryRunner: any): Promise<string[]> {
    const sequences = await queryRunner.query(`
      SELECT sequence_name
      FROM information_schema.sequences
      WHERE sequence_schema = 'public'
    `);

    const resetSqls: string[] = [];
    for (const seq of sequences) {
      const seqName = seq.sequence_name;
      resetSqls.push(
        `SELECT setval('${seqName}', COALESCE((SELECT MAX(id) FROM "${seqName.replace('_id_seq', '')}"), 1));`,
      );
    }

    return resetSqls;
  }

  private async ensureBackupDirectory(type: BackupType): Promise<void> {
    const dir = path.join(this.config.path, type);
    try {
      await fs.access(dir);
    } catch {
      await fs.mkdir(dir, { recursive: true });
      this.logger.log(`백업 디렉토리 생성: ${dir}`);
    }
  }

  private generateFilename(type: BackupType, timestamp: Date): string {
    const year = timestamp.getFullYear();
    const month = String(timestamp.getMonth() + 1).padStart(2, '0');
    const day = String(timestamp.getDate()).padStart(2, '0');
    const hour = String(timestamp.getHours()).padStart(2, '0');
    const minute = String(timestamp.getMinutes()).padStart(2, '0');
    const second = String(timestamp.getSeconds()).padStart(2, '0');

    return `backup_${type}_${year}${month}${day}_${hour}${minute}${second}.sql`;
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  설정조회한다(): BackupConfig {
    return { ...this.config };
  }
}
