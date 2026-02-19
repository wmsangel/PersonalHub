import type { LucideIcon } from "lucide-react";
import { CalendarDays, CheckSquare, FileText, LayoutDashboard, ShoppingCart, Users } from "lucide-react";

export type NavItem = {
  href: string;
  icon: LucideIcon;
  label: string;
};

export const navItems: NavItem[] = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Главная" },
  { href: "/dashboard/tasks", icon: CheckSquare, label: "Задачи" },
  { href: "/dashboard/shopping", icon: ShoppingCart, label: "Покупки" },
  { href: "/dashboard/notes", icon: FileText, label: "Заметки" },
  { href: "/dashboard/calendar", icon: CalendarDays, label: "Календарь" },
  { href: "/dashboard/family", icon: Users, label: "Семья" },
];
