import type { KeyboardEvent } from 'react';
/** Keep native controls in charge of their own Enter/escape popup semantics. */
export function dialogKeyboard(event: KeyboardEvent<HTMLElement>, cancel: () => void, affirmative?: () => void) {
  if (event.nativeEvent.isComposing || event.keyCode === 229) return;
  const target = event.target as HTMLElement;
  if (event.key === 'Escape') {
    event.stopPropagation();
    if (target.closest('select:open, [role="combobox"][aria-expanded="true"], [popover]:popover-open')) return;
    event.preventDefault();
    if (!event.repeat) cancel();
  } else if (event.key === 'Enter' && !event.repeat && !target.closest('button, select, textarea, summary, a, [role="combobox"], [role="menu"], [contenteditable="true"]')) {
    event.preventDefault(); event.stopPropagation();
    if (affirmative) affirmative();
    else event.currentTarget.querySelector<HTMLButtonElement>('[data-affirmative]:not(:disabled):not([inert] *)')?.click();
  }
}
