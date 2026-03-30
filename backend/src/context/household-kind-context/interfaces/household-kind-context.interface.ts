// ── Command DTOs ──

export class KindDefinitionItem {
  kindId: string;
  label: string;
  sortOrder: number;
}

export class SaveKindDefinitionsData {
  userId: string;
  items: KindDefinitionItem[];
}

// ── Result DTOs ──

export class KindDefinitionResult {
  id: string;
  kindId: string;
  label: string;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}
