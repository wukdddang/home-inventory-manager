"use client";

import { FolderTree, Layers, Package, PackagePlus } from "lucide-react";
import { motion } from "framer-motion";
import type { ReactNode } from "react";

/* ── 공통 상수 ── */

export const catalogModalBodyEase = [0.4, 0, 0.2, 1] as const;

export const inputClass =
  "w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/30";

export const btnOutline =
  "cursor-pointer rounded-xl border border-zinc-600 px-4 py-2 text-sm font-medium text-zinc-200 hover:bg-zinc-800";

export const btnPanel =
  "cursor-pointer rounded-lg border border-zinc-600 px-2 py-1 text-xs font-medium whitespace-nowrap text-zinc-300 hover:bg-zinc-800 sm:px-2.5";

/* ── 공통 유틸 ── */

export function sortByOrder<T extends { sortOrder?: number }>(list: T[]): T[] {
  return [...list].sort(
    (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || 0,
  );
}

/* ── 공통 UI ── */

export function CatalogModalFormBody({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, delay: 0.04, ease: catalogModalBodyEase }}
    >
      {children}
    </motion.div>
  );
}

/* ── 모달 간 네비게이션 ── */

export type CatalogModalId = "browser" | "category" | "product" | "variant";

const catalogModalNavItems: { id: CatalogModalId; label: string; icon: typeof Layers }[] = [
  { id: "browser", label: "카탈로그 관리", icon: Layers },
  { id: "category", label: "카테고리 관리", icon: FolderTree },
  { id: "product", label: "품목 관리", icon: Package },
  { id: "variant", label: "용량·포장 관리", icon: PackagePlus },
];

export function CatalogModalNav({
  current,
  onNavigate,
  disabledIds,
}: {
  current: CatalogModalId;
  onNavigate: (id: CatalogModalId) => void;
  disabledIds?: Set<CatalogModalId>;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {catalogModalNavItems
        .filter((item) => item.id !== current)
        .map((item) => {
          const Icon = item.icon;
          const disabled = disabledIds?.has(item.id) ?? false;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              disabled={disabled}
              className="inline-flex items-center gap-1 rounded-md border border-zinc-700 bg-zinc-800/60 px-2 py-1 text-xs font-medium text-zinc-300 transition hover:border-zinc-600 hover:text-zinc-100 disabled:opacity-40 disabled:hover:border-zinc-700 disabled:hover:text-zinc-300"
            >
              <Icon className="size-3" />
              {item.label}
            </button>
          );
        })}
    </div>
  );
}
