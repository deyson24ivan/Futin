let open = false;
const listeners = new Set<() => void>();

export const notificationStore = {
  getSnapshot: () => open,
  getServerSnapshot: () => false,
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  },
  setOpen(next: boolean) {
    open = next;
    listeners.forEach(listener => listener());
  },
};
