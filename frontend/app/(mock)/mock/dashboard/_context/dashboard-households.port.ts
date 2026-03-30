import type {
  GroupMember,
  Household,
  HouseholdKindDefinition,
  MemberRole,
  MockInvitation,
} from "@/types/domain";

export type CreateInvitationParams = {
  role: MemberRole;
  inviteeEmail?: string;
  expiresInDays?: number;
};

/**
 * 대시보드 거점 데이터 소스 포트.
 * mock 모드와 api 모드 모두 이 인터페이스를 구현한다.
 */
export type DashboardHouseholdsPort = {
  // ── 거점 목록 (읽기) ──
  list(): Promise<Household[]>;

  // ── 거점 CRUD ──
  create(name: string, kind: string): Promise<Household>;
  update(id: string, updates: { name?: string; kind?: string }): Promise<Household>;
  remove(id: string): Promise<void>;

  // ── 전체 스냅샷 저장 (mock 전용, api 모드는 no-op) ──
  saveAll(households: Household[]): Promise<void>;

  // ── 거점 유형 정의 ──
  listKinds(): Promise<HouseholdKindDefinition[]>;
  saveKinds(items: HouseholdKindDefinition[]): Promise<void>;

  // ── 멤버 관리 ──
  listMembers(householdId: string): Promise<GroupMember[]>;
  changeMemberRole(householdId: string, memberId: string, role: MemberRole): Promise<void>;
  removeMember(householdId: string, memberId: string): Promise<void>;

  // ── 초대 ──
  listInvitations(householdId: string): Promise<MockInvitation[]>;
  createInvitation(householdId: string, params: CreateInvitationParams): Promise<MockInvitation>;
  revokeInvitation(householdId: string, invitationId: string): Promise<void>;
};
