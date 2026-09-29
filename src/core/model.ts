export const SCHEMA_VERSION = 1;
export interface FavoriteNode {
  id: string;
  parentId?: string;
  title: string;
  url?: string;
  index?: number;
  dateAdded?: number;
  folderType?: string;
  syncing?: boolean;
  unmodifiable?: string;
  children?: FavoriteNode[];
}
export interface FolderPart { kind: 'title' | 'browser'; value: string }
export interface Locator { url: string; title: string; folderPath: FolderPart[] }
export type SystemLabel = 'JS' | 'HTTP';
export interface Favorite extends FavoriteNode {
  url: string;
  systemLabels: SystemLabel[];
  folderPath: string[];
  ancestorIds: string[];
  locator: Locator;
}
export interface Folder extends FavoriteNode {
  path: string[];
  ancestorIds: string[];
  writable: boolean;
  renamable: boolean;
}
export interface BookmarkMetadata {
  schemaVersion: 1;
  stableId: string;
  tags: string[];
  initialLocator: Locator;
  updatedAt: string;
}
export interface MetadataJournal {
  schemaVersion: 1;
  entries: Record<string, { metadata: BookmarkMetadata; locallyWrittenAt: string }>;
}
export interface MetadataHealth {
  status: 'valid' | 'missing' | 'quarantined' | 'deleted' | 'ambiguous';
  rawMeta: 'absent' | 'valid' | 'invalid';
  preservedLocally: boolean;
}
export interface LocatorHistory {
  schemaVersion: 1;
  stableId: string;
  locators: Locator[];
}
export interface Tombstone { schemaVersion: 1; stableId: string; deletedAt: string }
export interface LocalMapping {
  stableId: string;
  lastLocator: Locator;
  dateAdded?: number;
  method: 'explicit' | 'exact-locator';
}
export interface LocalState {
  schemaVersion: 1;
  mappings: Record<string, LocalMapping>;
  rootId: string | null;
  // Durable deletion intent survives a sync quota failure or worker restart.
  pendingDeletions: string[];
}
export interface MetadataState {
  records: BookmarkMetadata[];
  histories: Record<string, LocatorHistory>;
  tombstones: Record<string, Tombstone>;
  invalid: string[];
  raw: Record<string, unknown>;
}
export type MatchStatus = 'local-mapping' | 'exact-locator' | 'ambiguous' | 'unresolved' | 'deleted';
export interface Match {
  stableId: string;
  status: MatchStatus;
  bookmarkId?: string;
  candidateIds: string[];
}
export interface Reconciliation {
  mappings: Record<string, LocalMapping>;
  matches: Match[];
  historyWrites: Record<string, LocatorHistory>;
  warnings: string[];
}
export interface LogEntry { time: string; message: string }
export interface Snapshot {
  schemaVersion: 1;
  extensionId: string;
  version: string;
  favorites: Favorite[];
  folders: Folder[];
  tree: FavoriteNode[];
  metadata: MetadataState;
  local: LocalState;
  reconciliation: Reconciliation;
  metadataHealth: Record<string, MetadataHealth>;
  preservation: { available: boolean; stableIds: string[] };
  syncBytes: number;
  quotas: { bytes: number; perItem: number; items: number; writesPerMinute: number; writesPerHour: number };
  lastReconciliation: string;
  logs: LogEntry[];
  errors: string[];
}
// Confirmation is command-only, never persisted as metadata.
export interface LinkInput { title: string; url: string; parentId: string; tags: string[]; bookmarkletConfirmed?: boolean }
export type Command =
  | { type: 'snapshot' | 'reconcile' }
  | { type: 'set-root'; rootId: string | null }
  | { type: 'create'; input: LinkInput }
  | { type: 'edit'; id: string; input: LinkInput; expected: string }
  | { type: 'delete'; id: string; expected: string }
  | { type: 'create-folder'; parentId: string; title: string }
  | { type: 'rename-folder'; id: string; title: string; expectedTitle: string };
