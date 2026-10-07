import { dialogKeyboard } from './dialog-keyboard';
import { useLayoutEffect, useRef } from 'react';
import { FolderBindingReview, type BindingReviewProps } from './FolderBindingReview';

export function FolderBindingDialog({ onClose, ...props }: BindingReviewProps & { onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useLayoutEffect(() => {
    const element = dialog.current!;
    const previous = { overflow: document.documentElement.style.overflow, gutter: document.documentElement.style.scrollbarGutter };
    if (window.innerWidth > document.documentElement.clientWidth) document.documentElement.style.scrollbarGutter = 'stable';
    document.documentElement.style.overflow = 'hidden';
    element.showModal(); element.querySelector<HTMLElement>('h2')?.focus({ preventScroll: true });
    return () => { element.close(); document.documentElement.style.overflow = previous.overflow; document.documentElement.style.scrollbarGutter = previous.gutter; };
  }, []);
  const close = () => { if (dialog.current?.querySelector('[aria-busy="true"]')) return; onClose(); };
  return <dialog ref={dialog} className="favorite-editor binding-dialog" aria-labelledby="binding-dialog-heading" onCancel={event => { event.preventDefault(); event.stopPropagation(); close(); }} onKeyDownCapture={event => {
    dialogKeyboard(event, close);
    if (event.key === 'Tab') {
      const stops = [...event.currentTarget.querySelectorAll<HTMLElement>('input:not(:disabled),button:not(:disabled),summary')];
      const first = stops[0], last = stops.at(-1);
      if (!stops.includes(document.activeElement as HTMLElement)) { event.preventDefault(); (event.shiftKey ? last : first)?.focus(); }
      else if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }
  }}>
    <h2 id="binding-dialog-heading" tabIndex={-1}>Review folder tags</h2>
    <FolderBindingReview {...props} onCancel={close} />
  </dialog>;
}
