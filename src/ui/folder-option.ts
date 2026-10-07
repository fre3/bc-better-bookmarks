/** Expose native IDs only when full paths still cannot distinguish duplicates. */
export function folderOption(folder:{id:string;path:string[]}, folders:readonly {id:string;path:string[]}[]) {
 const path=folder.path.join(' / ');
 return folders.filter(f=>f.path.join(' / ')===path).length>1 ? `${path} [ID ${folder.id}]` : path;
}
