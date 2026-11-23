import { useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { CheckCircle2, Clock3, Link2, ShieldCheck } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { PageHeader, Section } from '@/components/common'
import { useAccount } from '@/context/account'
import { ConnectionCell } from './components/ConnectionCell'
import { KIND_LABELS, PRODUCTS } from './constants'
import { useGetLinkedInConfig, useGetLinkedInConnections } from '@/pages/linkedin/queries'

export function LinkedInPage() {
  const { accounts } = useAccount()
  const { data: config } = useGetLinkedInConfig()
  const { data: connections = [] } = useGetLinkedInConnections()
  const [params, setParams] = useSearchParams()

  useEffect(() => {
    const status = params.get('linkedin')
    if (!status) return
    if (status === 'connected') toast.success(`LinkedIn connected${params.get('name') ? `: ${params.get('name')}` : ''}`)
    else if (status === 'busy') {
      const wait = Number(params.get('wait')) || 2
      toast.info(`LinkedIn is busy right now (a lot of people are using it). Please try connecting again in about ${wait} minutes.`, { duration: 10_000 })
    } else toast.error(params.get('message') ?? 'LinkedIn connection failed')
    setParams({}, { replace: true })
  }, [params, setParams])

  return (
    <div className="mx-auto max-w-page space-y-4">
      <PageHeader eyebrow="Connections" back="/" title="LinkedIn" description="Which LinkedIn accounts the app can post to, and what the LinkedIn app is allowed to do." />

      {config && !config.configured && (
        <div className="rounded-lg border border-warn/50 bg-warn/10 px-4 py-3 text-sm">
          <b>LinkedIn isn't set up yet.</b> Add {config.missing.join(', ')} to <code>backend/.env</code> and restart the backend.
        </div>
      )}

      <Section icon={Link2}
        title="Connections"
        description="Connect a LinkedIn member to a personal or founder account to publish from the app. Connections last about 60 days, then need reconnecting."
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Account</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>LinkedIn connection</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {accounts.map((a) => (
              <TableRow key={a.id}>
                <TableCell className="font-medium">
                  {a.name} {a.is_test && <Badge variant="outline">test</Badge>}
                </TableCell>
                <TableCell>{KIND_LABELS[a.kind]}</TableCell>
                <TableCell className="whitespace-normal">
                  <ConnectionCell account={a} connection={connections.find((c) => c.account_id === a.id)} configured={!!config?.configured} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <p className="mt-3 text-xs text-muted-foreground">
          Add or rename accounts in <Link to="/settings?tab=general" className="underline">Settings → General</Link>.
        </p>
      </Section>

      <Section icon={ShieldCheck} title="LinkedIn app permissions" description="Products enabled on the LinkedIn developer app.">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>What it allows</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {PRODUCTS.map((p) => (
              <TableRow key={p.name}>
                <TableCell className="font-medium">{p.name}</TableCell>
                <TableCell>
                  {p.status === 'active' ? (
                    <span className="inline-flex items-center gap-1 text-xs text-good-fg">
                      <CheckCircle2 className="size-3.5" /> Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs text-serious-fg">
                      <Clock3 className="size-3.5" /> Not approved yet
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-xs whitespace-normal text-muted-foreground">{p.gives}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <p className="mt-3 text-xs text-muted-foreground">
          Redirect URL registered on the app: <code>http://localhost:8000/api/linkedin/callback</code>. This changes when the app is hosted.
        </p>
      </Section>
    </div>
  )
}
