"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

export type ShoppingItem = {
  id: string;
  title: string;
  quantity: string | null;
  category: string | null;
  is_checked: boolean;
  created_at: string;
};

export function useShoppingList(listId: string) {
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = getSupabaseBrowserClient();

  useEffect(() => {
    let isMounted = true;

    const loadItems = async () => {
      setIsLoading(true);
      const { data } = await supabase
        .from("shopping_items")
        .select("id, title, quantity, category, is_checked, created_at")
        .eq("list_id", listId)
        .order("created_at", { ascending: true });

      if (isMounted) {
        setItems((data ?? []) as ShoppingItem[]);
        setIsLoading(false);
      }
    };

    loadItems();

    const channel = supabase
      .channel(`shopping:${listId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "shopping_items",
          filter: `list_id=eq.${listId}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setItems((prev) => [...prev, payload.new as ShoppingItem]);
          }

          if (payload.eventType === "UPDATE") {
            setItems((prev) =>
              prev.map((item) =>
                item.id === payload.new.id ? (payload.new as ShoppingItem) : item,
              ),
            );
          }

          if (payload.eventType === "DELETE") {
            setItems((prev) => prev.filter((item) => item.id !== payload.old.id));
          }
        },
      )
      .subscribe();

    return () => {
      isMounted = false;
      void supabase.removeChannel(channel);
    };
  }, [listId, supabase]);

  return { items, isLoading };
}
