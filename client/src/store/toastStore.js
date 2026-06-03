import { create } from 'zustand'

let nextId = 1

export const useToastStore = create((set, get) => ({
  toasts: [],
  push: (toast) => {
    const id = nextId++
    const t = { id, kind: 'info', duration: 3200, ...toast }
    set((s) => ({ toasts: [...s.toasts, t] }))
    if (t.duration > 0) {
      setTimeout(() => get().dismiss(id), t.duration)
    }
    return id
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
  clear: () => set({ toasts: [] }),
}))

export const toast = {
  info:    (message, opts) => useToastStore.getState().push({ kind: 'info', message, ...opts }),
  success: (message, opts) => useToastStore.getState().push({ kind: 'success', message, ...opts }),
  error:   (message, opts) => useToastStore.getState().push({ kind: 'error', message, ...opts }),
  warn:    (message, opts) => useToastStore.getState().push({ kind: 'warn', message, ...opts }),
}
