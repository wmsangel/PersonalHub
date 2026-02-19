import type { Database } from "./database";

export type { Database };

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Family = Database["public"]["Tables"]["families"]["Row"];
export type FamilyMember = Database["public"]["Tables"]["family_members"]["Row"];
export type FamilyInvite = Database["public"]["Tables"]["family_invites"]["Row"];
export type Task = Database["public"]["Tables"]["tasks"]["Row"];
export type ShoppingList = Database["public"]["Tables"]["shopping_lists"]["Row"];
export type ShoppingItem = Database["public"]["Tables"]["shopping_items"]["Row"];
export type Note = Database["public"]["Tables"]["notes"]["Row"];
