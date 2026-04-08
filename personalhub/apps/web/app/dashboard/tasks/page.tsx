import { notFound, redirect } from "next/navigation";
import { CheckSquare, ClipboardList, Sparkles } from "lucide-react";
import { TaskDialog } from "@/components/tasks/TaskDialog";
import { TaskFilters } from "@/components/tasks/TaskFilters";
import { TaskItem } from "@/components/tasks/TaskItem";
import type { FamilyMemberOption, TaskPriority, TaskRow, TaskStatus } from "@/components/tasks/types";
import { Card } from "@/components/ui/card";
import { NoFamilyState } from "@/components/layout/NoFamilyState";
import { getTasksAction } from "@/lib/actions/tasks";
import { assertCanViewModule, canEditModule } from "@/lib/permissions";
import { getSupabaseServerClient } from "@/lib/supabase/server";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const readParam = (value: string | string[] | undefined): string => {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
};

const isTaskStatus = (value: string): value is TaskStatus =>
  value === "todo" || value === "in_progress" || value === "done";

const isTaskPriority = (value: string): value is TaskPriority =>
  value === "low" || value === "medium" || value === "high";

export default async function TasksPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const statusParam = readParam(params.status);
  const priorityParam = readParam(params.priority);
  const assignedToParam = readParam(params.assignedTo);

  const statusFilter = statusParam === "all" || isTaskStatus(statusParam) ? statusParam || "all" : "all";
  const priorityFilter = priorityParam === "all" || isTaskPriority(priorityParam) ? priorityParam : "all";
  const assignedToFilter = assignedToParam || "all";

  const tasksResult = await getTasksAction({
    status: statusFilter === "all" ? "all" : statusFilter,
    priority: priorityFilter === "all" ? undefined : (priorityFilter as TaskPriority),
    assignedTo: assignedToFilter === "all" ? undefined : assignedToFilter,
  });

  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth");
  }

  const membershipResult = await supabase
    .from("family_members")
    .select("id, family_id, role")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  if (!membershipResult.data) {
    return <NoFamilyState />;
  }

  const permissionResult = await supabase
    .from("member_permissions")
    .select("can_view, can_edit")
    .eq("member_id", membershipResult.data.id)
    .eq("module", "tasks")
    .limit(1)
    .maybeSingle();

  const canViewTasks = permissionResult.data?.can_view ?? membershipResult.data.role === "admin";
  const modulePermissions = {
    tasks: {
      canView: canViewTasks,
      canEdit: permissionResult.data?.can_edit ?? membershipResult.data.role === "admin",
    },
  };

  try {
    assertCanViewModule(modulePermissions, "tasks");
  } catch {
    notFound();
  }
  const canEditTasks = canEditModule(modulePermissions, "tasks");

  const membersResult = membershipResult?.data
    ? await supabase
        .from("family_members")
        .select("id, nickname, profiles(full_name)")
        .eq("family_id", membershipResult.data.family_id)
        .eq("is_active", true)
    : null;

  const members =
    membersResult?.data?.map((member) => {
      const profile = Array.isArray(member.profiles) ? member.profiles[0] : member.profiles;
      return {
        id: member.id,
        label: member.nickname || profile?.full_name || "Без имени",
      };
    }) ?? [];

  const memberLabelMap = new Map(members.map((member) => [member.id, member.label]));

  const tasks = (tasksResult.data as TaskRow[] | null) ?? [];

  const overdueCount = tasks.filter((task) => task.due_date && task.status !== "done" && new Date(`${task.due_date}T23:59:59`).getTime() < Date.now()).length;

  return (
    <section className="grid gap-7">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-[1.25rem] border border-indigo-500/18 bg-indigo-500/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
            <CheckSquare className="h-6 w-6 text-indigo-400" />
          </div>
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/[0.04] px-3 py-1.5 text-[11px] uppercase tracking-[0.2em] text-white/34">
              <Sparkles className="h-3.5 w-3.5 text-indigo-300" />
              фокус семьи
            </div>
            <h1 className="text-[2rem] font-semibold tracking-[-0.04em] text-white">Задачи</h1>
            <p className="mt-1 text-sm text-white/42">
              {tasks.length} активных {overdueCount > 0 ? `· ${overdueCount} просрочено` : ""}
            </p>
          </div>
        </div>
        <TaskDialog members={members as FamilyMemberOption[]} canEdit={canEditTasks} />
      </div>

      <Card className="p-4">
        <TaskFilters
          currentStatus={statusFilter}
          currentPriority={priorityFilter}
          currentAssignedTo={assignedToFilter}
          members={members as FamilyMemberOption[]}
        />
      </Card>

      {tasks.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-24 text-center">
          <div className="relative mb-6">
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-[1.8rem] border border-indigo-500/10 bg-gradient-to-br from-indigo-500/12 to-violet-600/12">
              <ClipboardList className="h-9 w-9 text-indigo-400/50" />
            </div>
            <div className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-indigo-500/30" />
            <div className="absolute -bottom-1.5 -left-1.5 h-2 w-2 rounded-full bg-violet-500/30" />
          </div>
          <h2 className="mb-2 text-[1.45rem] font-semibold tracking-[-0.04em] text-white">Пока нет задач</h2>
          <p className="mb-6 max-w-md text-sm leading-7 text-white/42">
            Создай первую задачу для семьи: добавь название, дедлайн и назначь исполнителя.
          </p>
          <TaskDialog members={members as FamilyMemberOption[]} canEdit={canEditTasks} />
        </Card>
      ) : (
        <div className="grid gap-3">
          {tasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              assigneeLabel={task.assigned_to ? memberLabelMap.get(task.assigned_to) ?? "Без назначения" : "Без назначения"}
              canEdit={canEditTasks}
            />
          ))}
        </div>
      )}
    </section>
  );
}
