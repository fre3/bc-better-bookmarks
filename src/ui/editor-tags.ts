import { normalizeTags } from '../core/logic';

/** UI representation only: persistence still receives one normalized tags array. */
export function splitArchiveTag(tags: string[]) {
  return { archived: normalizeTags(tags).includes('archived'), tags: tags.filter(tag => tag.trim().toLowerCase() !== 'archived') };
}
export function editorTags(tags: string[], archived: boolean) {
  return normalizeTags([...tags, ...(archived ? ['archived'] : [])]);
}
