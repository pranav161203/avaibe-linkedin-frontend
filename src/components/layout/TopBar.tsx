import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { addDays, format, parseISO } from 'date-fns'
import { AlertTriangle, Bell, CalendarDays, CheckCircle2, ChevronDown, ChevronRight, Clock, Hourglass, Link2, LogOut, Monitor, Moon, Sun, UserRound } from 'lucide-react'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useTheme, type Theme } from '@/context/theme'
import { useTz, ZONES, type ZoneId } from '@/context/timezone'
import { UserAvatar } from '@/components/layout/UserAvatar'
import { todayUae, ymd } from '@/components/period'
import { useAccount } from '@/context/account'
import { useAuth } from '@/context/auth'
import { useMe } from '@/lib/me'
import { dueByHand } from '@/lib/publishing'
import { cn } from '@/lib/utils'
import { useGetCalendarItems } from '@/pages/calendar/queries'
import { useGetPlannedPosts } from '@/pages/publishing/queries'

export function TopBar() {
  return (
    <div className="ml-auto flex items-center gap-2">
      <Notifications />
      <ProfileButton />
    </div>
  )
}

interface Note {
  key: string
  tone: 'alert' | 'todo' | 'info'
  icon: typeof Bell
  text: string
  sub?: string
  to: string
}

const AHEAD_DAYS = 14 // how far ahead holidays and events show
const SEEN_KEY = 'avaibe.notesSeen'
const HOLIDAY_KINDS = new Set(['uae_holiday', 'event'])

function readSeen(): string[] {
  try {
    return JSON.parse(localStorage.getItem(SEEN_KEY) ?? '[]')
  } catch {
    return []
  }
}

function useNotes(): Note[] {
  const { account } = useAccount()
  const { data: planned = [] } = useGetPlannedPosts(account?.id)
  const today = todayUae()
  const until = ymd(addDays(parseISO(today), AHEAD_DAYS))
  const { data: cal } = useGetCalendarItems(today, until)

  return useMemo(() => {
    const notes: Note[] = []
    const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`
    const problems = planned.filter((p) => p.status === 'failed' || p.status === 'missed').length
    if (problems) {
      notes.push({
        key: `problem:${problems}`,
        tone: 'alert',
        icon: AlertTriangle,
        text: `${plural(problems, 'post', 'posts')} failed or missed ${problems === 1 ? 'its' : 'their'} scheduled time`,
        sub: 'Review and reschedule',
        to: '/publishing?status=problem',
      })
    }
    const drafts = planned.filter((p) => p.status === 'draft').length
    if (drafts) {
      notes.push({ key: `drafts:${drafts}`, tone: 'todo', icon: Hourglass, text: `${plural(drafts, 'draft', 'drafts')} awaiting publication`, to: '/publishing?status=draft' })
    }
    const toMark = planned.filter(dueByHand).length
    if (toMark) {
      notes.push({
        key: `mark:${toMark}`,
        tone: 'todo',
        icon: Hourglass,
        text: `${plural(toMark, 'post', 'posts')} to publish manually on LinkedIn`,
        to: '/publishing?status=action',
      })
    }
    const upcoming = (cal?.items ?? [])
      .filter((i) => HOLIDAY_KINDS.has(i.kind) && i.end >= today)
      .sort((a, b) => a.start.localeCompare(b.start))
    for (const i of upcoming) {
      const when = i.start <= today ? 'Today' : format(parseISO(i.start), 'EEE d MMM')
      notes.push({
        key: `cal:${i.title}:${i.start}`,
        tone: 'info',
        icon: CalendarDays,
        text: i.kind === 'uae_holiday' ? `UAE holiday: ${i.title}` : i.title,
        sub: `${when}${i.status === 'expected' ? ' (date to be confirmed)' : ''}`,
        to: `/calendar?month=${i.start.slice(0, 7)}`,
      })
    }
    return notes
  }, [planned, cal, today])
}

function Notifications() {
  const notes = useNotes()
  const [seen, setSeen] = useState<string[]>(readSeen)
  const [open, setOpen] = useState(false)
  // What was new when the panel opened stays marked "new" while it is open
  const [fresh, setFresh] = useState<Set<string>>(new Set())
  const unread = notes.filter((n) => !seen.includes(n.key)).length
  const onOpenChange = (o: boolean) => {
    setOpen(o)
    if (!o) return
    setFresh(new Set(notes.filter((n) => !seen.includes(n.key)).map((n) => n.key)))
    const keys = notes.map((n) => n.key)
    setSeen(keys)
    try {
      localStorage.setItem(SEEN_KEY, JSON.stringify(keys))
    } catch {}
  }
  const action = notes.filter((n) => n.tone !== 'info')
  const coming = notes.filter((n) => n.tone === 'info')

  const List = ({ items }: { items: Note[] }) => (
    <ul className="space-y-1.5">
      {items.map((n) => (
        <li key={n.key}>
          <Link
            to={n.to}
            onClick={() => setOpen(false)}
            className="group flex items-start gap-3 rounded-xl px-3 py-2.5 ring-1 ring-border transition-colors hover:bg-muted"
          >
            <span
              className={cn(
                'mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full',
                n.tone === 'alert' ? 'bg-bad/10 text-bad-fg' : n.tone === 'todo' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground',
              )}
            >
              <n.icon className="size-4" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm leading-snug font-medium">{n.text}</span>
              {n.sub && <span className="block text-xs text-muted-foreground">{n.sub}</span>}
            </span>
            {fresh.has(n.key) && <span className="mt-1 shrink-0 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">New</span>}
            <ChevronRight className="mt-1.5 size-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
          </Link>
        </li>
      ))}
    </ul>
  )

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger
        aria-label={unread ? `Notifications, ${unread} new` : 'Notifications'}
        className="relative flex size-9 items-center justify-center rounded-full border bg-card text-muted-foreground shadow-xs transition-colors hover:text-foreground"
      >
        <Bell className="size-4" />
        {unread > 0 && <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-bad ring-2 ring-card" aria-hidden />}
      </SheetTrigger>
      <SheetContent side="right" className="w-full gap-0 sm:max-w-md">
        <SheetHeader className="border-b px-5 py-4">
          <SheetTitle className="flex items-center gap-2 text-base font-semibold">
            <Bell className="size-4" /> Notifications
          </SheetTitle>
          <SheetDescription className="text-xs">Pending actions, and UAE holidays and events in the next {AHEAD_DAYS} days.</SheetDescription>
        </SheetHeader>
        <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
          {notes.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-16 text-center text-sm text-muted-foreground">
              <CheckCircle2 className="size-8 text-good-fg" />
              No notifications.
            </div>
          ) : (
            <>
              <section>
                <h3 className="mb-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase">Needs action{action.length > 0 && ` · ${action.length}`}</h3>
                {action.length ? <List items={action} /> : <p className="text-sm text-muted-foreground">No pending actions.</p>}
              </section>
              {coming.length > 0 && (
                <section>
                  <h3 className="mb-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase">Coming up</h3>
                  <List items={coming} />
                </section>
              )}
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

const THEME_OPTIONS: { value: Theme; label: string; icon: typeof Sun }[] = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
]

function ProfileButton() {
  const me = useMe()
  const auth = useAuth()
  const navigate = useNavigate()
  const { theme, setTheme } = useTheme()
  const tz = useTz()
  const canSignOut = auth.enabled || !!auth.demoEmail

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger aria-label="Your profile" className="flex items-center gap-1 rounded-full p-0.5 transition-opacity hover:opacity-90">
          <UserAvatar className="size-9 ring-2 ring-card" />
          <ChevronDown className="size-4 text-muted-foreground" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuGroup>
            <DropdownMenuLabel className="flex items-center gap-3 text-foreground">
              <UserAvatar className="size-10" />
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium">{me.name}</span>
                <span className="block truncate text-xs font-normal text-muted-foreground">
                  {[me.role ?? (me.signedIn ? null : 'Local mode'), me.email].filter(Boolean).join(' · ')}
                </span>
              </span>
            </DropdownMenuLabel>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => navigate('/profile')}>
            <UserRound /> Profile
          </DropdownMenuItem>
          {auth.can('editor') && (
            <DropdownMenuItem onClick={() => navigate('/linkedin')}>
              <Link2 /> LinkedIn connections
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              {theme === 'dark' ? <Moon /> : theme === 'system' ? <Monitor /> : <Sun />} Appearance
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="w-48">
              <DropdownMenuGroup>
                <DropdownMenuLabel>Mode</DropdownMenuLabel>
                <DropdownMenuRadioGroup value={theme} onValueChange={(v) => setTheme(v as Theme)}>
                  {THEME_OPTIONS.map((t) => (
                    <DropdownMenuRadioItem key={t.value} value={t.value}>
                      <t.icon /> {t.label}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuGroup>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <Clock /> Time zone <span className="ml-auto pl-2 text-xs text-muted-foreground">{tz.label}</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuRadioGroup value={tz.zone} onValueChange={(v) => tz.setZone(v as ZoneId)}>
                {ZONES.map((z) => (
                  <DropdownMenuRadioItem key={z.id} value={z.id}>
                    {z.long}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          {canSignOut && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => auth.signOut()}>
                <LogOut /> Sign out
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  )
}
