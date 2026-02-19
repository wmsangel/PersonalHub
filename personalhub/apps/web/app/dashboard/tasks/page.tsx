import { notFound, redirect } from "next/navigation";
import { CheckSquare, ClipboardList } from "lucide-react";
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
    <section className="grid gap-6">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-indigo-500/20 bg-indigo-500/10">
            <CheckSquare className="h-6 w-6 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-white">Задачи</h1>
            <p className="mt-0.5 text-sm text-white/40">
              {tasks.length} активных {overdueCount > 0 ? `· ${overdueCount} просрочено` : ""}
            </p>
          </div>
        </div>
        <TaskDialog members={members as FamilyMemberOption[]} canEdit={canEditTasks} />
      </div>

      <TaskFilters
        currentStatus={statusFilter}
        currentPriority={priorityFilter}
        currentAssignedTo={assignedToFilter}
        members={members as FamilyMemberOption[]}
      />

      {tasks.length === 0 ? (
        <Card className="flex flex-col items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.03] py-24 text-center">
          <div className="relative mb-6">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl border border-indigo-500/10 bg-gradient-to-br from-indigo-500/10 to-violet-600/10">
              <ClipboardList className="h-9 w-9 text-indigo-400/50" />
            </div>
            <div className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-indigo-500/30" />
            <div className="absolute -bottom-1.5 -left-1.5 h-2 w-2 rounded-full bg-violet-500/30" />
          </div>
          <h2 className="mb-2 text-lg font-semibold text-white">Пока нет задач</h2>
          <p className="mb-6 max-w-md text-sm leading-relaxed text-white/40">
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
