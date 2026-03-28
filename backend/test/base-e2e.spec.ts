import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as request from 'supertest';
import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';

/**
 * 테스트용 Mock Mail Service
 */
class MockMailService {
  public sentEmails: { to: string; token: string }[] = [];

  async 인증_이메일을_발송한다(to: string, token: string): Promise<void> {
    this.sentEmails.push({ to, token });
  }
}

/**
 * E2E 테스트 베이스 클래스
 */
export class BaseE2ETest {
  public app: INestApplication;
  protected dataSource: DataSource;
  public mockMailService: MockMailService;
  private postgresContainer: StartedPostgreSqlContainer;

  request() {
    return {
      get: (url: string) =>
        request(this.app.getHttpServer()).get(url),
      post: (url: string) =>
        request(this.app.getHttpServer()).post(url),
      put: (url: string) =>
        request(this.app.getHttpServer()).put(url),
      patch: (url: string) =>
        request(this.app.getHttpServer()).patch(url),
      delete: (url: string) =>
        request(this.app.getHttpServer()).delete(url),
    };
  }

  authenticatedRequest(accessToken: string) {
    return {
      get: (url: string) =>
        request(this.app.getHttpServer())
          .get(url)
          .set('Authorization', `Bearer ${accessToken}`),
      post: (url: string) =>
        request(this.app.getHttpServer())
          .post(url)
          .set('Authorization', `Bearer ${accessToken}`),
      put: (url: string) =>
        request(this.app.getHttpServer())
          .put(url)
          .set('Authorization', `Bearer ${accessToken}`),
      patch: (url: string) =>
        request(this.app.getHttpServer())
          .patch(url)
          .set('Authorization', `Bearer ${accessToken}`),
      delete: (url: string) =>
        request(this.app.getHttpServer())
          .delete(url)
          .set('Authorization', `Bearer ${accessToken}`),
    };
  }

  getRepository(entityName: string) {
    return this.dataSource.getRepository(entityName);
  }

  async initializeApp(): Promise<void> {
    // 1. PostgreSQL 테스트 컨테이너 시작
    this.postgresContainer = await new PostgreSqlContainer('postgres:16-alpine')
      .withDatabase('him_test')
      .withUsername('test_user')
      .withPassword('test_password')
      .withExposedPorts(5432)
      .start();

    const url = new URL(this.postgresContainer.getConnectionUri());
    process.env.DB_HOST = url.hostname;
    process.env.DB_PORT = url.port;
    process.env.DB_USERNAME = url.username;
    process.env.DB_PASSWORD = url.password;
    process.env.DB_DATABASE = url.pathname.replace('/', '');

    // 2. 환경변수 설정 (AppModule import 전에 반드시 설정)
    process.env.JWT_SECRET = 'test-jwt-secret';
    process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret';
    process.env.JWT_EXPIRES_IN = '30m';
    process.env.JWT_REFRESH_EXPIRES_IN = '7d';
    process.env.MAIL_USER = 'test@example.com';
    process.env.MAIL_PASSWORD = 'test-password';
    process.env.MAIL_FROM = '"Test" <test@example.com>';
    process.env.APP_URL = 'http://localhost:4100';

    // 3. 동적 import (환경변수 설정 후 AppModule 로드)
    const { AppModule } = await import('../src/app.module');
    const { MailService } = await import(
      '../src/common/infrastructure/mail/mail.service'
    );

    this.mockMailService = new MockMailService();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(MailService)
      .useValue(this.mockMailService)
      .compile();

    this.app = moduleFixture.createNestApplication();
    this.app.setGlobalPrefix('api');
    this.app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    this.app.enableCors();

    this.dataSource = moduleFixture.get<DataSource>(DataSource);
    await this.dataSource.synchronize(true);
    await this.app.init();
  }

  async closeApp(): Promise<void> {
    if (this.app) {
      await this.app.close();
    }
    if (this.postgresContainer) {
      await this.postgresContainer.stop();
    }
  }

  async cleanDatabase(): Promise<void> {
    if (!this.dataSource.isInitialized) return;

    const entities = this.dataSource.entityMetadatas;
    for (const entity of entities) {
      await this.dataSource.query(
        `TRUNCATE TABLE "${entity.tableName}" RESTART IDENTITY CASCADE`,
      );
    }
  }

  async beforeAll(): Promise<void> {
    await this.initializeApp();
  }

  async afterAll(): Promise<void> {
    await this.closeApp();
  }
}
