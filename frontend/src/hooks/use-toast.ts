import { useState, useCallback } from 'react';

export type ToastVariant = 'default' | 'destructive';

export interface Toast {
  id: string;
  title?: string;
  description?: string;
  variant?: ToastVariant;
  action?: React.ReactNode;
}

let toastCount = 0;

type Listener = (toasts: Toast[]) => void;
const listeners: Listener[] = [];
let toasts: Toast[] = [];

function dispatch(action: { type: 'ADD'; toast: Toast } | { type: 'REMOVE'; id: string }) {
  if (action.type === 'ADD') {
    toasts = [...toasts, action.toast];
  } else {
    toasts = toasts.filter((t) => t.id !== action.id);
  }
  listeners.forEach((l) => l(toasts));
}

export function toast(props: Omit<Toast, 'id'>) {
  const id = String(++toastCount);
  dispatch({ type: 'ADD', toast: { ...props, id } });
  setTimeout(() => dispatch({ type: 'REMOVE', id }), 4000);
  return id;
}

export function useToast() {
  const [currentToasts, setToasts] = useState<Toast[]>(toasts);

  const subscribe = useCallback((listener: Listener) => {
    listeners.push(listener);
    return () => {
      const idx = listeners.indexOf(listener);
      if (idx > -1) listeners.splice(idx, 1);
    };
  }, []);

  useState(() => {
    const unsub = subscribe(setToasts);
    return unsub;
  });

  return { toasts: currentToasts, toast };
}
