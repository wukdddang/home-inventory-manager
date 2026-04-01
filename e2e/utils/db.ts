import { Client } from "pg";

const DB_CONFIG = {
  host: "localhost",
  port: 54320,
  user: "e2e",
  password: "e2e",
  database: "him_e2e",
};

/**
 * 모든 애플리케이션 테이블의 데이터를 삭제한다.
 * 매 테스트 케이스 전에 호출하여 테스트 독립성을 보장한다.
 */
export async function resetDatabase(): Promise<void> {
  const client = new Client(DB_CONFIG);
  await client.connect();

  try {
    // public 스키마의 모든 테이블을 조회 (TypeORM 마이그레이션 테이블 제외)
    const { rows } = await client.query<{ tablename: string }>(`
      SELECT tablename FROM pg_tables
      WHERE schemaname = 'public'
        AND tablename NOT LIKE 'typeorm%'
    `);

    if (rows.length > 0) {
      const tables = rows.map((r) => `"${r.tablename}"`).join(", ");
      await client.query(`TRUNCATE TABLE ${tables} CASCADE`);
    }
  } finally {
    await client.end();
  }
}

/**
 * 임의의 SQL 쿼리를 실행하고 결과 행을 반환한다.
 */
export async function query<T extends Record<string, unknown> = Record<string, unknown>>(
  sql: string,
  params: unknown[] = []
): Promise<T[]> {
  const client = new Client(DB_CONFIG);
  await client.connect();

  try {
    const { rows } = await client.query<T>(sql, params);
    return rows;
  } finally {
    await client.end();
  }
}
