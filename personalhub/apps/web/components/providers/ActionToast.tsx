"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";

type ActionToastProps = {
  status?: string;
  message?: string;
};

export function ActionToast({ status, message }: ActionToastProps) {
  const lastToastKey = useRef<string>("");

  useEffect(() => {
    if (!message) {
      return;
    }

    const nextStatus = status ?? "info";
    const toastKey = `${nextStatus}:${message}`;

    if (lastToastKey.current === toastKey) {
      return;
    }

    if (nextStatus === "error") {
      toast.error(message);
    } else if (nextStatus === "success") {
      toast.success(message);
    } else {
      toast.info(message);
    }

    lastToastKey.current = toastKey;
  }, [status, message]);

  return null;
}
