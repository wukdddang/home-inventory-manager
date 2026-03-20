"use client";

import * as React from "react";

import type {
  ToastActionElement,
  ToastProps,
} from "@/app/_ui/feedback/toast";

const TOAST_LIMIT = 4;
/** 토스트가 화면에 머무는 시간(ms) */
const TOAST_DEFAULT_DURATION = 4000;
/** 닫힘 애니메이션 후 DOM에서 제거까지 대기 (toast.tsx 퇴장 시간과 맞춤) */
const TOAST_EXIT_DURATION_MS = 320;

type ToasterToast = ToastProps & {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: ToastActionElement;
};

const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
} as const;

let count = 0;

function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER;
  return count.toString();
}

type ActionType = typeof actionTypes;

type Action =
  | {
      type: ActionType["ADD_TOAST"];
      toast: ToasterToast;
    }
  | {
      type: ActionType["UPDATE_TOAST"];
      toast: Partial<ToasterToast> & Pick<ToasterToast, "id">;
    }
  | {
      type: ActionType["DISMISS_TOAST"];
      toastId?: ToasterToast["id"];
    }
  | {
      type: ActionType["REMOVE_TOAST"];
      toastId?: ToasterToast["id"];
    };

interface State {
  toasts: ToasterToast[];
}

const removeFromDomTimeouts = new Map<string, ReturnType<typeof setTimeout>>();
const autoDismissTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

function clearRemoveTimeout(toastId: string) {
  const t = removeFromDomTimeouts.get(toastId);
  if (t) clearTimeout(t);
  removeFromDomTimeouts.delete(toastId);
}

function clearAutoDismissTimeout(toastId: string) {
  const t = autoDismissTimeouts.get(toastId);
  if (t) clearTimeout(t);
  autoDismissTimeouts.delete(toastId);
}

/** `open: false` 이후 퇴장 애니메이션을 보여 준 뒤 언마운트 */
const scheduleRemoveFromDom = (toastId: string, delay = TOAST_EXIT_DURATION_MS) => {
  clearRemoveTimeout(toastId);
  const timeout = setTimeout(() => {
    removeFromDomTimeouts.delete(toastId);
    dispatch({
      type: actionTypes.REMOVE_TOAST,
      toastId,
    });
  }, delay);
  removeFromDomTimeouts.set(toastId, timeout);
};

/** 표시 시간이 끝나면 먼저 DISMISS(닫힘 애니메이션) → 이후 scheduleRemoveFromDom */
const scheduleAutoDismiss = (toastId: string, delay: number) => {
  clearAutoDismissTimeout(toastId);
  const timeout = setTimeout(() => {
    autoDismissTimeouts.delete(toastId);
    dispatch({ type: actionTypes.DISMISS_TOAST, toastId });
  }, delay);
  autoDismissTimeouts.set(toastId, timeout);
};

export const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case actionTypes.ADD_TOAST:
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      };

    case actionTypes.UPDATE_TOAST:
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t,
        ),
      };

    case actionTypes.DISMISS_TOAST: {
      const { toastId } = action;

      if (toastId) {
        clearAutoDismissTimeout(toastId);
        scheduleRemoveFromDom(toastId, TOAST_EXIT_DURATION_MS);
      } else {
        state.toasts.forEach((t) => {
          clearAutoDismissTimeout(t.id);
          scheduleRemoveFromDom(t.id, TOAST_EXIT_DURATION_MS);
        });
      }

      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === toastId || toastId === undefined
            ? { ...t, open: false }
            : t,
        ),
      };
    }
    case actionTypes.REMOVE_TOAST:
      if (action.toastId === undefined) {
        [...removeFromDomTimeouts.keys()].forEach(clearRemoveTimeout);
        [...autoDismissTimeouts.keys()].forEach(clearAutoDismissTimeout);
        return { ...state, toasts: [] };
      }
      clearRemoveTimeout(action.toastId);
      clearAutoDismissTimeout(action.toastId);
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      };
  }
};

const listeners: Array<(state: State) => void> = [];

let memoryState: State = { toasts: [] };

function dispatch(action: Action) {
  memoryState = reducer(memoryState, action);
  listeners.forEach((listener) => {
    listener(memoryState);
  });
}

type ToastInput = Omit<ToasterToast, "id">;

function toastFn({ duration, ...props }: ToastInput) {
  const id = genId();

  const update = (next: Partial<ToasterToast>) =>
    dispatch({
      type: actionTypes.UPDATE_TOAST,
      toast: { ...next, id },
    });

  const dismiss = () =>
    dispatch({ type: actionTypes.DISMISS_TOAST, toastId: id });

  dispatch({
    type: actionTypes.ADD_TOAST,
    toast: {
      ...props,
      id,
      open: true,
      duration: duration ?? TOAST_DEFAULT_DURATION,
      onOpenChange: (open) => {
        if (!open) dismiss();
      },
    },
  });

  const finalDuration = duration ?? TOAST_DEFAULT_DURATION;
  if (finalDuration > 0) {
    scheduleAutoDismiss(id, finalDuration);
  }

  return { id, dismiss, update };
}

function useToast() {
  const [state, setState] = React.useState<State>(memoryState);

  React.useEffect(() => {
    listeners.push(setState);
    return () => {
      const i = listeners.indexOf(setState);
      if (i > -1) listeners.splice(i, 1);
    };
  }, []);

  return {
    ...state,
    toast: toastFn,
    dismiss: (toastId?: string) =>
      dispatch({ type: actionTypes.DISMISS_TOAST, toastId }),
  };
}

export { useToast, toastFn as toast };
