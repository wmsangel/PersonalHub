"use client";

import { useEffect, useMemo, useState } from "react";
import { Bell, Dot } from "lucide-react";
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
          className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-white/72 transition-all duration-200 hover:border-white/14 hover:bg-white/[0.07] hover:text-white"
          aria-label="Уведомления"
        >
          <Bell className="h-4.5 w-4.5" />
          {unreadCount > 0 ? (
            <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-gradient-to-r from-rose-500 to-fuchsia-500 px-1 text-[10px] font-semibold text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          ) : null}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-[360px] rounded-[1.4rem] border-white/10 bg-[#12141b]/96 p-2 backdrop-blur-xl">
        <div className="px-3 pb-2 pt-1">
          <p className="text-sm font-medium text-white">Уведомления</p>
          <p className="text-xs text-white/40">Последние изменения в семейном пространстве.</p>
        </div>

        {notifications.length === 0 ? (
          <div className="rounded-[1rem] border border-white/8 bg-white/[0.035] p-5 text-center text-sm text-white/42">
            Пока спокойно. Новые события появятся здесь.
          </div>
        ) : (
          <div className="space-y-1">
            {notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className={cn(
                  "items-start gap-2 rounded-[1rem] px-3 py-3.5 cursor-default",
                  !notification.is_read
                    ? "border border-indigo-500/14 bg-indigo-500/[0.08]"
                    : "border border-transparent bg-white/[0.025]"
                )}
              >
                <div className="mt-0.5 text-indigo-300">
                  <Dot className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-white">{notification.title}</p>
                  {notification.body ? (
                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-white/46">{notification.body}</p>
                  ) : null}
                  <p className="mt-1.5 text-[11px] uppercase tracking-[0.18em] text-white/28">
                    {formatRelativeTime(notification.created_at)}
                  </p>
                </div>
              </DropdownMenuItem>
            ))}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
