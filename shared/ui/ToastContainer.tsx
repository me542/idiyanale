"use client";

import React, { useState, useEffect, useCallback } from "react";
import { X, AlertCircle, Save, SquareChartGantt, Check, User, MessageSquare, Pencil,} from "lucide-react";

export type ToastType = | "saved" | "error" | "endorsed" | "approved" | "assigned" | "resolved" | "success" | "message" | "edited" | "cancel";

export interface ToastItem {
  id: number;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

const TOAST_EVENT = "app-toast-event";

const dispatchToast = (toast: Omit<ToastItem, "id">) => {
  window.dispatchEvent(
    new CustomEvent(TOAST_EVENT, {
      detail: toast,
    })
  );
};

const ANIMATION_DELAY = 50;

type AnimationState =
  | "entering"
  | "visible"
  | "hiding"
  | "hidden";

const useToastAlert = (
  duration = 3000,
  onClose: () => void
) => {
  const [state, setState] =
    useState<AnimationState>("entering");

  useEffect(() => {
    const enter = setTimeout(
      () => setState("visible"),
      ANIMATION_DELAY
    );

    const hide = setTimeout(
      () => setState("hiding"),
      duration
    );

    return () => {
      clearTimeout(enter);
      clearTimeout(hide);
    };
  }, [duration]);

  const handleEnd = () => {
    if (state === "hiding") {
      setState("hidden");
      onClose();
    }
  };

  const animation = {
    entering: "translate-x-10 opacity-0 scale-95",
    visible: "translate-x-0 opacity-100 scale-100",
    hiding: "translate-x-10 opacity-0 scale-95",
    hidden: "hidden",
  }[state];

  return {
    animation,
    handleEnd,
    close: () => setState("hiding"),
  };
};

const toastStyles: Record<
  ToastType,
  {
    bg: string;
    border: string;
    icon: React.ReactNode;
    iconColor: string;
  }
> = {
  saved: {
    bg: "bg-green-50",
    border: "border-green-200",
    iconColor: "text-green-600",
    icon: <Save size={20} />,
  },

  error: {
    bg: "bg-red-50",
    border: "border-red-200",
    iconColor: "text-red-600",
    icon: <AlertCircle size={20} />,
  },

  endorsed: {
    bg: "bg-amber-50",
    border: "border-amber-200",
    iconColor: "text-amber-600",
    icon: <SquareChartGantt size={20} />,
  },

  approved: {
    bg: "bg-blue-50",
    border: "border-blue-200",
    iconColor: "text-blue-600",
    icon: <Check size={20} />,
  },

  assigned: {
    bg: "bg-indigo-50",
    border: "border-indigo-200",
    iconColor: "text-indigo-600",
    icon: <User size={20} />,
  },

  resolved: {
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    iconColor: "text-emerald-600",
    icon: <Check size={20} />,
  },

  success: {
    bg: "bg-green-50",
    border: "border-green-200",
    iconColor: "text-green-600",
    icon: <Check size={20} />,
  },

  message: {
    bg: "bg-sky-50",
    border: "border-sky-200",
    iconColor: "text-sky-600",
    icon: <MessageSquare size={20} />,
  },

  edited: {
    bg: "bg-violet-50",
    border: "border-violet-200",
    iconColor: "text-violet-600",
    icon: <Pencil size={20} />,
  },

  cancel: {
    bg: "bg-gray-50",
    border: "border-gray-200",
    iconColor: "text-gray-600",
    icon: <X size={20} />,
  },
};

const Toast: React.FC<
  ToastItem & {
    onClose: () => void;
  }
> = ({
  type,
  title,
  message,
  duration = 3000,
  onClose,
}) => {
  const {
    animation,
    handleEnd,
    close,
  } = useToastAlert(duration, onClose);

  const style = toastStyles[type];

  return (
    <div
      role="alert"
      onTransitionEnd={handleEnd}
      className={`
        w-[360px]
        rounded-xl
        border
        ${style.bg}
        ${style.border}
        shadow-lg
        overflow-hidden
        transform
        transition-all
        duration-300
        ease-out
        ${animation}
      `}
    >
      <div className="flex items-start gap-4 p-4">
        <div
          className={`${style.iconColor} flex-shrink-0 mt-0.5`}
        >
          {style.icon}
        </div>

        <div className="flex-1 min-w-0">
          {title && (
            <h3 className="text-sm font-semibold text-slate-900">
              {title}
            </h3>
          )}

          <p
            className={`text-sm ${
              title
                ? "text-slate-600 mt-1"
                : "font-medium text-slate-900"
            }`}
          >
            {message}
          </p>
        </div>

        <button
          onClick={close}
          className="
            rounded-md
            p-1
            text-slate-400
            hover:bg-black/5
            hover:text-slate-700
            transition-colors
          "
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};

// -----------------------------------------------------------------------------
// Toast Container
// -----------------------------------------------------------------------------

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    const handleAddToast = (event: Event) => {
      const detail = (event as CustomEvent)
        .detail as Omit<ToastItem, "id">;

      setToasts((prev) => [
        ...prev,
        {
          ...detail,
          id: Date.now() + Math.random(),
        },
      ]);
    };

    window.addEventListener(
      TOAST_EVENT,
      handleAddToast
    );

    return () =>
      window.removeEventListener(
        TOAST_EVENT,
        handleAddToast
      );
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) =>
      prev.filter((toast) => toast.id !== id)
    );
  }, []);

  return (
    <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-3">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          {...toast}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
}

// -----------------------------------------------------------------------------
// Hook
// -----------------------------------------------------------------------------

export function useAppToast() {
  const toast =
    (type: ToastType) =>
    (
      message: string,
      title?: string,
      duration?: number
    ) => {
      dispatchToast({
        type,
        message,
        title,
        duration,
      });
    };

  return {
    saved: toast("saved"),
    error: toast("error"),
    endorsed: toast("endorsed"),
    approved: toast("approved"),
    assigned: toast("assigned"),
    resolved: toast("resolved"),
    success: toast("success"),
    message: toast("message"),
    edited: toast("edited"),
    cancel: toast("cancel"),
  };
}