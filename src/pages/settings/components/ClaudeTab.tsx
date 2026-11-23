import { CheckCircle2, CircleAlert, Receipt, Sparkles } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { Section } from '@/components/common'
import { BrandKitForm } from './BrandKitForm'
import { fmtNumber } from '@/lib/format'
import { useGetClaudeStatus, useGetSettings } from '@/pages/settings/queries'

export function ClaudeTab() {
  const { data, isLoading } = useGetClaudeStatus()
  const settings = useGetSettings()
  if (isLoading || !data) return <Skeleton className="h-48" />
  const u = data.usage
  return (
    <div className="space-y-4">
    {settings.data ? (
      <BrandKitForm key={JSON.stringify(settings.data.current.brand)} current={settings.data.current.brand} />
    ) : (
      <Skeleton className="h-48" />
    )}
    <Section icon={Sparkles} title="Claude (AI) connection" description="Claude powers Strategy ideas on the Suggestions page. The API key is stored only on the server and is never shown here.">
      <dl className="grid gap-4 text-sm sm:grid-cols-3">
        <div>
          <dt className="text-xs text-muted-foreground">Status</dt>
          <dd className="mt-1">
            {data.configured ? (
              <span className="inline-flex items-center gap-1.5 text-good-fg">
                <CheckCircle2 className="size-4" /> API key set {data.key_hint && <span className="text-muted-foreground">({data.key_hint})</span>}
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
          <dd className="mt-1">{u.daily_limit_per_account} idea runs per account</dd>
        </div>
      </dl>
      {!data.configured && (
        <div className="mt-4 rounded-md border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
          To connect: create an API key at console.anthropic.com (with your manager’s approval, since usage is billed), add{' '}
          <code>ANTHROPIC_API_KEY=…</code> to <code>server/.env</code>, and restart the backend. Never paste the key into chat or documents.
        </div>
      )}
    </Section>

    <Section icon={Receipt}
      title="Usage this month"
      description={`Since ${u.month_start_uae} (UAE). Cost is an estimate from token counts and list prices; the Anthropic Console shows the real bill.`}
    >
      <dl className="grid gap-4 text-sm sm:grid-cols-4">
        <div>
          <dt className="text-xs text-muted-foreground">Idea runs</dt>
          <dd className="mt-1 text-lg font-semibold tabular-nums">{u.runs}</dd>
          {u.failed_runs > 0 && <dd className="text-xs text-muted-foreground">{u.failed_runs} failed (not billed)</dd>}
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Tokens read</dt>
          <dd className="mt-1 text-lg font-semibold tabular-nums">{fmtNumber(u.input_tokens)}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Tokens written</dt>
          <dd className="mt-1 text-lg font-semibold tabular-nums">{fmtNumber(u.output_tokens)}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Estimated cost</dt>
          <dd className="mt-1 text-lg font-semibold tabular-nums">US${u.estimated_cost_usd.toFixed(2)}</dd>
        </div>
      </dl>
    </Section>
    </div>
  )
}
