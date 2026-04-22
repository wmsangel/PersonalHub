import Link from "next/link";
import { ArrowRight, Home, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function NoFamilyState({
  title = "Семейное пространство не подключено",
  description = 'Чтобы этот раздел начал работать, создайте или подключите семейное пространство в разделе "Семья".',
}: {
  title?: string;
  description?: string;
}) {
  return (
    <Card className="relative overflow-hidden p-8 text-center sm:p-10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.12),transparent_26%),radial-gradient(circle_at_bottom_left,rgba(99,102,241,0.14),transparent_28%)]" />

      <div className="relative mx-auto max-w-2xl">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[1.4rem] border border-white/10 bg-white/[0.06] text-cyan-100 shadow-[0_18px_40px_rgba(0,0,0,0.18)]">
          <Home className="h-6 w-6" />
        </div>

        <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/[0.04] px-3 py-1.5 text-[11px] uppercase tracking-[0.2em] text-white/38">
          <Sparkles className="h-3.5 w-3.5 text-cyan-300" />
          следующий шаг
        </div>

        <h2 className="mt-5 text-[2rem] font-semibold tracking-[-0.04em] text-white sm:text-[2.4rem]">{title}</h2>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-white/46">{description}</p>

        <div className="mt-7 flex justify-center">
          <Button asChild size="lg">
            <Link href="/dashboard/family">
              Открыть раздел «Семья»
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </Card>
  );
}
