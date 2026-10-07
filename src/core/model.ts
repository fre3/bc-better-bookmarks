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
  /** Derived application policy; never synchronized or used for identity. */
  nativeRestriction?: string;
  workspaceRole?: 'root' | 'container' | 'content' | 'loose';
  workspaceId?: string;
}
export interface FolderPart { kind: 'title' | 'browser'; value: string }
export interface Locator { kind?: 'folder'; url: string; title: string; folderPath: FolderPart[] }
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
  generation?: string;
  schemaVersion: 1 | 2;
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
  generation?: string;
  schemaVersion: 1 | 2;
  stableId: string;
  locators: Locator[];
}
export interface Tombstone { generation?: string; schemaVersion: 1; stableId: string; deletedAt: string }
export interface LocalMapping {
  stableId: string;
  lastLocator: Locator;
  dateAdded?: number;
  method: 'explicit' | 'exact-locator';
}
export interface LocalState {
  metadataEpoch?: string;
  schemaVersion: 1;
  mappings: Record<string, LocalMapping>;
  /** Legacy mutation scope, retained for local envelope compatibility only; ignored. */
  rootId: string | null;
  // Durable deletion intent survives a sync quota failure or worker restart.
  pendingDeletions: string[];
}
export interface MetadataState {
  ignored?: string[];
  setup?: { generation: string; phase: 'resetting' | 'ready' };
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
  reason?: string;
}
export interface Reconciliation {
  mappings: Record<string, LocalMapping>;
  matches: Match[];
  historyWrites: Record<string, LocatorHistory>;
  warnings: string[];
}
export interface LogEntry { time: string; message: string }
export interface CreationReceipt { request: string; generation?: string; id?: string; native?: string; stableId: string; record?: BookmarkMetadata; complete?: boolean }
export interface Snapshot {
  mutation?: { id: string; parentId: string };
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
export type Command = (
  | { type: 'snapshot' | 'reconcile' }
  | { type: 'create'; input: LinkInput; requestId?: string; destinationExpected?: string }
  | { type: 'edit'; id: string; input: LinkInput; expected: string }
  | { type: 'delete'; id: string; expected: string; subtreeExpected?:string }
  | { type: 'create-folder'; parentId: string; title: string; tags?: string[]; requestId?: string; destinationExpected?: string }
  | { type: 'move'; id: string; expected: string; placement: import('./operations').Placement; destinationExpected: string }
  | { type: 'edit-folder'; id: string; title: string; tags: string[]; expected: string }
  | { type: 'attach-folder'; id: string; stableId: string; expected: string }
  | { type: 'rename-folder'; id: string; title: string; expectedTitle: string }) & { generation?: string };
