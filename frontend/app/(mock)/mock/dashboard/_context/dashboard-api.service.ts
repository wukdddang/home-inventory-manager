import {
  getHouseholds,
  getSharedHouseholdKindDefinitions,
  setHouseholds,
  setSharedHouseholdKindDefinitions,
} from "@/lib/local-store";
import { cloneDefaultHouseholdKindDefinitions } from "@/lib/household-kind-defaults";
import type {
  GroupMember,
  Household,
  HouseholdKindDefinition,
  MemberRole,
  MockInvitation,
} from "@/types/domain";
import type { CreateInvitationParams, DashboardHouseholdsPort } from "./dashboard-households.port";
import { cloneDefaultCatalog } from "./dashboard-mock.service";
import { ensureHouseholdShape } from "@/lib/household-location";

/* ─────────────────────────────────────────────────────── helpers ── */

async function apiFetch<T>(
  input: RequestInfo,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(input, init);
  const json = await res.json();
  if (!json.success) throw new Error(json.message ?? "API 오류");
  return json.data as T;
}

/** 백엔드 HouseholdKindDefinition → 프론트 HouseholdKindDefinition */
function mapKind(raw: {
  kindId: string;
  label: string;
  sortOrder: number;
}): HouseholdKindDefinition {
  return { id: raw.kindId, label: raw.label, sortOrder: raw.sortOrder };
}

/** 백엔드 Household → 프론트 Household (rooms/items/catalog는 localStorage 오버레이) */
function mergeWithLocal(
  remote: { id: string; name: string; kind: string | null; createdAt: string },
  local: Household | undefined,
): Household {
  const base = ensureHouseholdShape(
    local ?? {
      id: remote.id,
      name: remote.name,
      kind: remote.kind ?? "home",
      rooms: [],
      items: [],
      furniturePlacements: [],
      storageLocations: [],
      createdAt: remote.createdAt,
      catalog: cloneDefaultCatalog(),
    },
  );
  return {
    ...base,
    name: remote.name,
    kind: remote.kind ?? base.kind,
  };
}

/** 백엔드 멤버 → GroupMember */
function mapMember(raw: {
  id: string;
  email: string;
  displayName: string;
  role: string;
}): GroupMember {
  return {
    id: raw.id,
    email: raw.email,
    role: raw.role as MemberRole,
    label: raw.displayName || undefined,
  };
}

/** 백엔드 Invitation → MockInvitation */
function mapInvitation(raw: {
  id: string;
  householdId: string;
  role: string;
  token: string;
  createdAt: string;
}): MockInvitation {
  return {
    id: raw.id,
    householdId: raw.householdId,
    role: raw.role as MemberRole,
    token: raw.token,
    createdAt: raw.createdAt,
  };
}

/* ─────────────────────────────────────────────────────── service ── */

export const dashboardApiHouseholdsClient: DashboardHouseholdsPort = {
  /* ── 거점 목록 ── */
  async list() {
    const remoteList = await apiFetch<
      { id: string; name: string; kind: string | null; createdAt: string }[]
    >("/api/households");

    const local = getHouseholds();
    const localById = new Map(local.map((h) => [h.id, h]));

    // 각 거점의 멤버도 병렬로 fetch
    const withMembers = await Promise.all(
      remoteList.map(async (remote) => {
        const household = mergeWithLocal(remote, localById.get(remote.id));
        try {
          const members = await apiFetch<
            { id: string; email: string; displayName: string; role: string }[]
          >(`/api/households/${remote.id}/members`);
          household.members = members.map(mapMember);
        } catch {
          household.members = [];
        }
        return household;
      }),
    );

    // localStorage 동기화 (rooms/items/catalog 보존)
    setHouseholds(withMembers);
    return withMembers;
  },

  /* ── 거점 생성 ── */
  async create(name, kind) {
    const remote = await apiFetch<{
      id: string; name: string; kind: string | null; createdAt: string;
    }>("/api/households", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, kind }),
    });
    return mergeWithLocal(remote, undefined);
  },

  /* ── 거점 수정 ── */
  async update(id, updates) {
    const remote = await apiFetch<{
      id: string; name: string; kind: string | null; createdAt: string;
    }>(`/api/households/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    const local = getHouseholds().find((h) => h.id === id);
    return mergeWithLocal(remote, local);
  },

  /* ── 거점 삭제 ── */
  async remove(id) {
    await apiFetch<void>(`/api/households/${id}`, { method: "DELETE" });
  },

  /* ── 전체 저장 (api 모드에서는 no-op; 개별 API 호출로 대체됨) ── */
  async saveAll(households) {
    setHouseholds(households); // localStorage 동기화만 유지
  },

  /* ── 거점 유형 정의 ── */
  async listKinds() {
    try {
      const raw = await apiFetch<
        { kindId: string; label: string; sortOrder: number }[]
      >("/api/household-kind-definitions");
      if (!raw || raw.length === 0) {
        return getSharedHouseholdKindDefinitions();
      }
      const kinds = raw.map(mapKind);
      setSharedHouseholdKindDefinitions(kinds);
      return kinds;
    } catch {
      // 백엔드 실패 시 로컬 폴백
      const local = getSharedHouseholdKindDefinitions();
      return local.length > 0 ? local : cloneDefaultHouseholdKindDefinitions();
    }
  },

  async saveKinds(items) {
    const payload = items.map((item, i) => ({
      kindId: item.id,
      label: item.label,
      sortOrder: item.sortOrder ?? i,
    }));
    await apiFetch<unknown>("/api/household-kind-definitions", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: payload }),
    });
    setSharedHouseholdKindDefinitions(items);
  },

  /* ── 멤버 목록 ── */
  async listMembers(householdId) {
    const raw = await apiFetch<
      { id: string; email: string; displayName: string; role: string }[]
    >(`/api/households/${householdId}/members`);
    return raw.map(mapMember);
  },

  /* ── 멤버 역할 변경 ── */
  async changeMemberRole(householdId, memberId, role) {
    await apiFetch<unknown>(
      `/api/households/${householdId}/members/${memberId}/role`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      },
    );
  },

  /* ── 멤버 제거 ── */
  async removeMember(householdId, memberId) {
    await apiFetch<void>(
      `/api/households/${householdId}/members/${memberId}`,
      { method: "DELETE" },
    );
  },

  /* ── 초대 목록 ── */
  async listInvitations(householdId) {
    const raw = await apiFetch<
      { id: string; householdId: string; role: string; token: string; createdAt: string }[]
    >(`/api/households/${householdId}/invitations`);
    return raw.map(mapInvitation);
  },

  /* ── 초대 생성 ── */
  async createInvitation(householdId, params) {
    const raw = await apiFetch<{
      id: string; householdId: string; role: string; token: string; createdAt: string;
    }>(`/api/households/${householdId}/invitations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
    return mapInvitation(raw);
  },

  /* ── 초대 취소 ── */
  async revokeInvitation(householdId, invitationId) {
    await apiFetch<void>(
      `/api/households/${householdId}/invitations/${invitationId}`,
      { method: "DELETE" },
    );
  },
};
