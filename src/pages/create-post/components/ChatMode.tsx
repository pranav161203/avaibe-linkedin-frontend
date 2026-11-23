import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Globe, MessagesSquare, RotateCcw, SendHorizontal, Sparkles, Type } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/context/auth'
import { cn } from '@/lib/utils'
import { Block, TextBox } from './TextBlocks'
import type { Draft, ChatEntry } from '../types'
import { assistantText } from '../utils'
import { useGetPostChatStatus, useSendPostChat } from '@/pages/create-post/queries'

export function ChatMode({
  accountId,
  draft,
  onUseText,
  getAttachment,
  initialText,
}: {
  accountId: number
  draft: Draft
  onUseText: (text: string) => void
  getAttachment: () => Promise<File | null>
  initialText?: string
}) {
  const auth = useAuth()
  const [entries, setEntries] = useState<ChatEntry[]>([])
  const [text, setText] = useState(initialText ?? '')
  const [cost, setCost] = useState(0)
  const [web, setWeb] = useState(false)
  const bottom = useRef<HTMLDivElement>(null)
  const status = useGetPostChatStatus(accountId)
  const limit = status.data?.session_limit ?? 20
  const send = useSendPostChat(accountId)
  const sendChat = (history: ChatEntry[]) =>
    send.mutate(
      {
        body: {
          account_id: accountId,
          format: draft.format,
          caption: draft.caption,
          topic: draft.topic.trim() || null,
          industry: draft.industry.trim() || null,
          cta: draft.cta.trim() || null,
          goal: draft.goal,
          messages: history.map((e) => (e.role === 'user' ? { role: 'user', content: e.content } : { role: 'assistant', content: assistantText(e.turn) })),
          web_search: web,
        },
        getAttachment: () => getAttachment(),
      },
      {
        onSuccess: (r) => {
          setEntries((list) => [...list, { role: 'assistant', turn: r.result }])
          setCost((c) => c + r.cost_usd)
        },
        onError: (e) => {
          toast.error(e.message)
          const last = history.at(-1)
          if (last?.role === 'user') {
            setEntries(history.slice(0, -1))
            setText(last.content)
          }
        },
      },
    )
  useEffect(() => {
    bottom.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [entries.length, send.isPending])
  useEffect(() => {
    setEntries([])
    setCost(0)
  }, [accountId])

  const configured = status.data?.configured
  const leftToday = status.data ? status.data.daily_limit - status.data.messages_today : null
  const full = entries.length >= limit
  const canSend = configured && auth.can('editor') && !send.isPending && !full && leftToday !== 0
  const submit = () => {
    const msg = text.trim()
    if (!msg || !canSend) return
    const next: ChatEntry[] = [...entries, { role: 'user', content: msg }]
    setEntries(next)
    setText('')
    sendChat(next)
  }
  const pick = (question: string, option: string) => {
    const lines = text.split('\n').filter((l) => l.trim() && !l.startsWith(`${question} →`))
    setText([...lines, `${question} → ${option}`].join('\n'))
  }
  const lastAssistant = [...entries].reverse().find((e) => e.role === 'assistant') as Extract<ChatEntry, { role: 'assistant' }> | undefined

  if (!entries.length && !send.isPending && !initialText) {
    return (
      <div className="rounded-xl border border-dashed px-6 py-10 text-center">
        <MessagesSquare className="mx-auto mb-3 size-6 text-primary/60" />
        <p className="text-sm font-medium">Work on this post together with the AI</p>
        <p className="mx-auto mt-1 mb-4 max-w-sm text-xs text-muted-foreground">
          It starts by asking you a few questions (goal, audience, what readers should do), then writes and revises the post with you. Every message is one AI
          request, so nothing is used until you start.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button onClick={() => sendChat([])} disabled={!configured || !auth.can('editor') || leftToday === 0}>
            <MessagesSquare /> Start session
          </Button>
          <label className="inline-flex cursor-pointer items-center gap-1.5 text-xs text-muted-foreground">
            <input type="checkbox" checked={web} onChange={(ev) => setWeb(ev.target.checked)} />
            <Globe className="size-3.5" /> Search the web too
          </label>
        </div>
        {leftToday != null && configured && <p className="mt-2 text-xs text-muted-foreground">{leftToday} messages left today</p>}
      </div>
    )
  }

  return (
    <div className="flex flex-col rounded-xl ring-1 ring-border">
      <div className="max-h-[520px] min-h-64 space-y-4 overflow-y-auto p-4">
        {!entries.length && !send.isPending && (
          <p className="py-6 text-center text-sm text-muted-foreground">Your question is in the box below. Press send to ask the AI.</p>
        )}
        {entries.map((e, i) =>
          e.role === 'user' ? (
            <div key={i} className="flex justify-end">
              <div className="max-w-[85%] rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-sm whitespace-pre-wrap text-primary-foreground">
                {e.content}
              </div>
            </div>
          ) : (
            <div key={i} className="flex gap-2.5">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Sparkles className="size-3.5" />
              </span>
              <div className="min-w-0 flex-1 space-y-2.5">
                <div className="rounded-2xl rounded-tl-md bg-muted/60 px-4 py-2.5 text-sm whitespace-pre-wrap">{e.turn.message}</div>
                {!!e.turn.sources?.length && (
                  <div className="rounded-xl bg-muted/30 px-3 py-2 text-xs">
                    <div className="mb-1 flex items-center gap-1.5 font-medium text-muted-foreground">
                      <Globe className="size-3.5" /> Searched the web ({e.turn.searches ?? 0} {e.turn.searches === 1 ? 'search' : 'searches'}). Sources:
                    </div>
                    <ul className="space-y-0.5">
                      {e.turn.sources.map((s) => (
                        <li key={s.url} className="truncate">
                          <a href={s.url} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                            {s.title}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {e.turn.questions.map((q) => (
                  <div key={q.question} className="rounded-xl px-3 py-2.5 ring-1 ring-border">
                    <div className="mb-2 text-sm font-medium">{q.question}</div>
                    <div className="flex flex-wrap gap-1.5">
                      {q.options.map((o) => {
                        const chosen = e === lastAssistant && text.split('\n').includes(`${q.question} → ${o}`)
                        return (
                          <button
                            key={o}
                            type="button"
                            disabled={e !== lastAssistant || !canSend}
                            onClick={() => pick(q.question, o)}
                            className={cn(
                              'rounded-full px-3 py-1 text-xs font-medium ring-1 transition-colors disabled:opacity-60',
                              chosen ? 'bg-primary text-primary-foreground ring-transparent' : 'ring-border hover:bg-muted',
                            )}
                          >
                            {o}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}
                {e.turn.draft_text && (
                  <Block
                    icon={Type}
                    title="Suggested post"
                    action={
                      <Button variant="outline" size="sm" onClick={() => onUseText(e.turn.draft_text!)}>
                        Use this
                      </Button>
                    }
                  >
                    <TextBox text={e.turn.draft_text} />
                  </Block>
                )}
              </div>
            </div>
          ),
        )}
        {send.isPending && (
          <div className="flex gap-2.5">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Sparkles className="size-3.5 animate-pulse" />
            </span>
            <div className="rounded-2xl rounded-tl-md bg-muted/60 px-4 py-2.5 text-sm text-muted-foreground">
              {web ? 'Searching the web, then thinking…' : 'Thinking…'}
            </div>
          </div>
        )}
        <div ref={bottom} />
      </div>

      <div className="border-t p-3">
        {full ? (
          <p className="py-2 text-center text-sm text-muted-foreground">This session has reached {limit} messages. Start a new one to keep going.</p>
        ) : (
          <div className="flex items-end gap-2">
            <Textarea
              value={text}
              onChange={(ev) => setText(ev.target.value.slice(0, 2000))}
              onKeyDown={(ev) => {
                if (ev.key === 'Enter' && !ev.shiftKey) {
                  ev.preventDefault()
                  submit()
                }
              }}
              rows={2}
              placeholder="Answer, or ask for a change (e.g. “make it shorter”, “aim it at CTOs”)…"
              className="min-h-11 resize-none rounded-xl"
            />
            <Button size="icon" onClick={submit} disabled={!text.trim() || !canSend} aria-label="Send">
              <SendHorizontal />
            </Button>
          </div>
        )}
        <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
          <label
            className={cn(
              'inline-flex cursor-pointer items-center gap-1.5 rounded-full px-2 py-0.5 ring-1',
              web ? 'bg-primary/10 text-primary ring-primary/30' : 'ring-border',
            )}
            title="Let the AI look up current news, events and public competitor pages for your next messages (about $0.03–0.06 more per message)"
          >
            <input type="checkbox" className="sr-only" checked={web} onChange={(ev) => setWeb(ev.target.checked)} />
            <Globe className="size-3" /> Web search {web ? 'on' : 'off'}
          </label>
          <span>
            {entries.length} of {limit} messages · about ${cost.toFixed(3)} so far
          </span>
          <button
            type="button"
            onClick={() => {
              setEntries([])
              setCost(0)
              setText('')
            }}
            disabled={send.isPending}
            className="ml-auto inline-flex items-center gap-1 hover:text-foreground"
          >
            <RotateCcw className="size-3" /> New session
          </button>
        </div>
      </div>
    </div>
  )
}
