/** Coalesce geometry writes outside ResizeObserver delivery. Coverage runs
 * before its dependent footer reservation in the same frame. Idle layout never
 * polls; reveal owners may reschedule only while a CSS transition is running.
 * Disposal cancels pending work. */
type Task = { measure: () => void; order: number; disposed: boolean };
const pending = new Set<Task>();
let frame: number | undefined;

export function layoutTask(measure: () => void, order = 0) {
  const task: Task = { measure, order, disposed: false };
  const schedule = () => {
    if (task.disposed) return;
    pending.add(task);
    if (frame !== undefined) return;
    frame = requestAnimationFrame(() => {
      frame = undefined;
      const batch = [...pending].sort((a, b) => a.order - b.order);
      pending.clear();
      for (const work of batch) if (!work.disposed) work.measure();
    });
  };
  return { schedule, dispose: () => {
    task.disposed = true;
    pending.delete(task);
    if (!pending.size && frame !== undefined) { cancelAnimationFrame(frame); frame = undefined; }
  } };
}
