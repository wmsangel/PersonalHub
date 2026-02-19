import Link from "next/link";
import { Home } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function NoFamilyState({
  title = "Семейное пространство не подключено",
  description = "Чтобы работать с этим разделом, создайте или присоединитесь к семье в разделе \"Семья\".",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <Card className="grid justify-items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.03] p-10 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-indigo-500/25 bg-indigo-500/10">
        <Home className="h-5 w-5 text-indigo-300" />
      </div>
      <h2 className="text-lg font-semibold text-white">{title}</h2>
      <p className="max-w-xl text-sm text-white/50">{description}</p>
      <Button asChild>
        <Link href="/dashboard/family">Открыть раздел «Семья»</Link>
      </Button>
    </Card>
  );
}
