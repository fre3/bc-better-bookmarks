import type { ClipboardEvent } from 'react';
import { isBookmarklet } from '../core/logic';
/** Text inputs strip CR/LF. Do not silently alter opaque executable code. */
export function singleLineUrlPaste(event:ClipboardEvent<HTMLInputElement>,report:(message:string)=>void) {
 const pasted=event.clipboardData.getData('text');
 const element=event.currentTarget;
 const candidate=element.value.slice(0,element.selectionStart??0)+pasted+element.value.slice(element.selectionEnd??element.value.length);
 if(/[\r\n]/.test(pasted)&&isBookmarklet(candidate)){
  event.preventDefault();report('Multiline bookmarklet paste was not applied. Use a deliberately prepared single-line bookmarklet; its code is not automatically rewritten.');
 }
}
