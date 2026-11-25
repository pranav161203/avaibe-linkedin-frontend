import { CheckCircle2, CircleAlert, Receipt, Sparkles } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Section } from "@/components/common";
import { BrandKitForm } from "./BrandKitForm";
import { fmtNumber } from "@/lib/format";
import { useGetClaudeStatus, useGetSettings } from "@/pages/settings/queries";
import { useAuth } from "@/context/auth";

export function ClaudeTab() {
  const { data, isLoading } = useGetClaudeStatus();
  const settings = useGetSettings();
  const isOwner = useAuth().user?.role === "superadmin";
  if (isLoading || !data) return <Skeleton className="h-48" />;
  const u = data.usage;
  return (
    <div className="space-y-4">
      {settings.data ? (
        <BrandKitForm
          key={JSON.stringify(settings.data.current.brand)}
          current={settings.data.current.brand}
        />
      ) : (
        <Skeleton className="h-48" />
      )}
      <Section
        icon={Sparkles}
        title="Claude connection"
        description="Claude generates strategy ideas on the Suggestions page. The API key is stored on the server and is never displayed."
      >
        <dl className="grid gap-4 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-xs text-muted-foreground">Status</dt>
            <dd className="mt-1">
              {data.configured ? (
                <span className="inline-flex items-center gap-1.5 text-good-fg">
                  <CheckCircle2 className="size-4" /> Connected{" "}
                  {data.key_hint && (
                    <span className="text-muted-foreground">
                      ({data.key_hint})
                    </span>
                  )}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-serious-fg">
                  <CircleAlert className="size-4" /> Not connected
                </span>
              )}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Model</dt>
            <dd className="mt-1 font-mono text-xs">{data.model}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Daily limit</dt>
            <dd className="mt-1">
              {data.daily_limit_per_account} runs per account
            </dd>
          </div>
        </dl>
        {!data.configured && !isOwner && (
          <div className="mt-4 rounded-md border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
            Contact the platform owner to enable Claude.
          </div>
        )}
        {!data.configured && isOwner && (
          <div className="mt-4 rounded-md border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
            To connect, create an API key in the Anthropic Console (usage is
            billed; approval required), add <code>ANTHROPIC_API_KEY=…</code> to{" "}
            <code>server/.env</code> and restart the server. Do not share the
            key in messages or documents.
          </div>
        )}
      </Section>

      {u && (
        <Section
          icon={Receipt}
          title="Usage this month"
          description={`Since ${u.month_start_uae} (UAE time). Cost is estimated from token counts and list prices. See the Anthropic Console for actual billing.`}
        >
          <dl className="grid gap-4 text-sm sm:grid-cols-4">
            <div>
              <dt className="text-xs text-muted-foreground">Runs</dt>
              <dd className="mt-1 text-lg font-semibold tabular-nums">
                {u.runs}
              </dd>
              {u.failed_runs > 0 && (
                <dd className="text-xs text-muted-foreground">
                  {u.failed_runs} failed, not billed
                </dd>
              )}
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Input tokens</dt>
              <dd className="mt-1 text-lg font-semibold tabular-nums">
                {fmtNumber(u.input_tokens)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Output tokens</dt>
              <dd className="mt-1 text-lg font-semibold tabular-nums">
                {fmtNumber(u.output_tokens)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Estimated cost</dt>
              <dd className="mt-1 text-lg font-semibold tabular-nums">
                US${u.estimated_cost_usd.toFixed(2)}
              </dd>
            </div>
          </dl>
        </Section>
      )}
    </div>
  );
}
