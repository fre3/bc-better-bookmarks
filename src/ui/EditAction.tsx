export function EditAction({ id, title, folder = false, onEdit }: { id: string; title: string; folder?: boolean; onEdit: (id: string) => void }) {
  return <button type="button" className="item-edit-action" id={`edit-${folder ? 'folder' : 'bookmark'}-${id}`} aria-label={`Edit ${folder ? 'folder' : 'favorite'} ${title || '(untitled)'}`} aria-haspopup="dialog" onClick={event => { event.stopPropagation(); onEdit(id); }}>Edit</button>;
}
