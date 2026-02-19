"use client";

import { useEffect, useMemo, useState } from "react";
import { Bell } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { cn } from "@/lib/utils";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

type NotificationItem = {
  id: string;
  title: string;
  body: string | null;
  is_read: boolean;
  created_at: string;
};

const formatRelativeTime = (isoDate: string): string => {
  const diffMs = Date.now() - new Date(isoDate).getTime();
  const diffMinutes = Math.max(0, Math.floor(diffMs / 60000));

  if (diffMinutes < 1) return "только что";
  if (diffMinutes < 60) return `${diffMinutes} мин назад`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} ч назад`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} дн назад`;
};

export function NotificationBell({ userId }: { userId: string }) {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const unreadCount = notifications.filter((item) => !item.is_read).length;

  useEffect(() => {
    let isMounted = true;

    const loadNotifications = async () => {
      const { data } = await supabase
        .from("notifications")
        .select("id, title, body, is_read, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(10);

      if (isMounted) {
        setNotifications((data as NotificationItem[] | null) ?? []);
      }
    };

    void loadNotifications();

    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const item = payload.new as NotificationItem;
          setNotifications((prev) => [item, ...prev].slice(0, 10));
        },
      )
      .subscribe();

    return () => {
      isMounted = false;
      void supabase.removeChannel(channel);
    };
  }, [supabase, userId]);

  const markAllRead = async () => {
    const unreadIds = notifications.filter((item) => !item.is_read).map((item) => item.id);
    if (unreadIds.length === 0) return;

    setNotifications((prev) => prev.map((item) => ({ ...item, is_read: true })));
    await supabase.from("notifications").update({ is_read: true }).in("id", unreadIds);
  };

  return (
    <DropdownMenu onOpenChange={(open) => (open ? void markAllRead() : undefined)}>
      <DropdownMenuTrigger asChild>
        <button
          className="relative rounded-lg p-2 text-white/70 transition-colors hover:bg-white/[0.06] hover:text-white"
          aria-label="Уведомления"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-rose-500" />}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80 border-white/[0.08] bg-[#171717]">
        {notifications.length === 0 ? (
          <div className="p-4 text-center text-sm text-white/40">Нет уведомлений</div>
        ) : (
          notifications.map((notification) => (
            <DropdownMenuItem
              key={notification.id}
              className={cn(
                "items-start gap-2 py-3 cursor-default",
                !notification.is_read && "bg-indigo-500/10",
              )}
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-white">{notification.title}</p>
                {notification.body && <p className="mt-0.5 line-clamp-2 text-xs text-white/50">{notification.body}</p>}
                <p className="mt-1 text-[11px] text-white/35">{formatRelativeTime(notification.created_at)}</p>
              </div>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
