import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { CalendarClock, ChevronRight, Eye, Globe, PenSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { SimpleSelect, BackButton, PostRef } from '@/components/common'
import { PostingTimeHint } from './PostingTimeHint'
import { useAuth } from '@/context/auth'
import { isoToZonedInput, UAE, useTz, zonedInputToIso, zoneLabel } from '@/context/timezone'
import { PLANNED_FORMATS, type PlannedDetails, type PlannedFormat, type PlannedPost, type PlannedPostInput, type PostGoal, POST_GOALS } from '@/lib/api'
import { PLANNED_FORMAT_LABELS } from '@/lib/publishing'
import { cn } from '@/lib/utils'
import { AiPanel } from './AiPanel'
import { FormatFields } from './FormatFields'
import { IconTile } from './IconTile'
import { PreviewDialog } from './PreviewDialog'
import { MAX_CHARS, GOAL_ICON, FORMAT_ICON } from '../constants'
import { visualFor } from '../utils'
import { useSavePlannedPost } from '@/pages/create-post/queries'

export function Editor({ accountId, accountName, initial }: { accountId: number; accountName: string; initial?: PlannedPost }) {
  const tz = useTz()
  const auth = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [zone] = useState(tz.zone)
  const formatParam = params.get('format') as PlannedFormat | null
  const [format, setFormat] = useState<PlannedFormat>(initial?.format ?? (formatParam && PLANNED_FORMATS.includes(formatParam) ? formatParam : 'text'))
  const [details, setDetails] = useState<PlannedDetails>(initial?.details ?? {})
  const setDetail = <K extends keyof PlannedDetails>(k: K, v: PlannedDetails[K]) => setDetails((d) => ({ ...d, [k]: v }))
  const [media, setMedia] = useState<File | null>(null)
  const manual = format !== 'text' && format !== 'image'

  const [caption, setCaption] = useState(initial?.caption ?? '')
  const newAt = params.get('new_at')
  const startAt = initial?.scheduled_at ?? (newAt && !Number.isNaN(Date.parse(newAt)) ? newAt : null)
  const [scheduled, setScheduled] = useState(startAt ? isoToZonedInput(startAt, zone) : '')
  const [visibility, setVisibility] = useState<'PUBLIC' | 'CONNECTIONS'>(initial?.visibility ?? 'PUBLIC')
  const [goal, setGoal] = useState<PostGoal | null>(initial?.goal ?? null)
  const [goalMissing, setGoalMissing] = useState(false)
  const [topic, setTopic] = useState(initial?.topic ?? '')
  const [industry, setIndustry] = useState(initial?.industry ?? '')
  const [cta, setCta] = useState(initial?.cta ?? '')
  const [imageAlt, setImageAlt] = useState(initial?.image_alt ?? '')
  const [file, setFile] = useState<File | null>(null)
  const [removeImage, setRemoveImage] = useState(false)
  const [saving, setSaving] = useState<'draft' | 'schedule' | null>(null)
  const savePost = useSavePlannedPost(accountId)
  const [preview, setPreview] = useState(false)
  const canApprove = auth.can('approver')
  const canEdit = auth.can('editor')
  const over = caption.length > MAX_CHARS

  const save = async (mode: 'draft' | 'schedule') => {
    if (!goal) {
      setGoalMissing(true)
      document.getElementById('goal')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return toast.error('Choose the goal of the post')
    }
    if (!caption.trim()) return toast.error('Write the post text first')
    if (over) return toast.error(`LinkedIn allows ${MAX_CHARS.toLocaleString()} characters`)
    const options = (details.options ?? []).map((o) => o.trim()).filter(Boolean)
    if (format === 'poll' && (!details.question?.trim() || options.length < 2)) return toast.error('A poll needs a question and at least 2 options')
    if (mode === 'schedule' && !scheduled) return toast.error(manual ? 'Pick the planned date first' : 'Pick a date and time to schedule it')
    const body: PlannedPostInput = {
      account_id: accountId,
      format,
      details: format === 'poll' ? { ...details, options } : details,
      caption,
      image_alt: imageAlt.trim() || null,
      visibility,
      scheduled_at: scheduled ? zonedInputToIso(scheduled, zone) : null,
      goal,
      topic: topic.trim() || null,
      industry: industry.trim() || null,
      cta: cta.trim() || null,
      keywords: [],
    }
    setSaving(mode)
    try {
      await savePost.mutateAsync({
        id: initial?.id,
        body,
        image: file,
        removeImage: removeImage && !!initial?.has_image,
        media,
        approve: mode === 'schedule' && canApprove,
      })
      if (mode === 'schedule' && canApprove) {
        toast.success(
          manual ? 'Planned. Post it on LinkedIn by hand at that time, then mark it as posted.' : 'Scheduled: the app will publish it at that time.',
        )
      } else if (mode === 'schedule') {
        toast.success('Saved and sent to an approver. It will be scheduled once they publish it.')
      } else {
        toast.success(initial?.status === 'approved' ? 'Saved as unpublished: it is no longer scheduled until it is published again.' : 'Draft saved')
      }
      navigate(params.get('from') === 'calendar' ? '/calendar' : '/publishing')
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setSaving(null)
    }
  }

  return (
    <div className="mx-auto max-w-page">
      <nav className="mb-1 flex items-center gap-1.5 text-sm text-muted-foreground" aria-label="Breadcrumb">
        {(initial || params.get('from') === 'calendar') && <BackButton fallback={params.get('from') === 'calendar' ? '/calendar' : '/publishing'} />}
        <Link to={params.get('from') === 'calendar' ? '/calendar' : '/publishing'} className="hover:text-foreground">
          {params.get('from') === 'calendar' ? 'Calendar' : 'Publishing'}
        </Link>
        <ChevronRight className="size-3.5" />
        <span className="text-foreground">{initial ? 'Edit post' : 'Create post'}</span>
        {initial?.ref && <PostRef id={initial.ref} className="ml-1" />}
      </nav>
      <h1 className="text-[32px] leading-tight font-semibold tracking-tight">{initial ? 'Edit post' : 'Create post'}</h1>
      <p className="mt-1 mb-6 text-sm text-muted-foreground">
        Write, check and schedule a LinkedIn post for {accountName}. AI suggestions run only when you click Analyse.
      </p>
      {initial?.status === 'approved' && (
        <p className="-mt-3 mb-5 rounded-xl bg-warn/10 px-3 py-2 text-xs ring-1 ring-warn/40">
          This post is scheduled. Saving changes takes it off the schedule
          {canApprove ? ' (Schedule post puts it back on)' : ' until an approver publishes it again'}; leaving without saving changes nothing.
        </p>
      )}

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,6fr)_minmax(0,5fr)]">
        <section className="flex flex-col overflow-hidden rounded-[1.8rem] bg-card">
          <header className="flex items-center gap-3 border-b px-6 py-4">
            <IconTile icon={PenSquare} />
            <h2 className="text-lg font-semibold">{initial ? 'Edit post' : 'New post'}</h2>
            <Button variant="outline" className="ml-auto" onClick={() => setPreview(true)} disabled={!caption.trim()}>
              <Eye /> Preview
            </Button>
          </header>

          <div className="space-y-5 px-6 py-5">
            <div id="goal" className="scroll-mt-24">
              <Label className="mb-2 block font-semibold">
                Goal <span className="text-bad-fg">*</span>
              </Label>
              <div
                role="radiogroup"
                aria-label="Goal of the post"
                className={cn('grid gap-2 sm:grid-cols-4', goalMissing && !goal && 'rounded-2xl ring-2 ring-bad/40 ring-offset-4 ring-offset-card')}
              >
                {POST_GOALS.map((g) => {
                  const Icon = GOAL_ICON[g.value]
                  const on = goal === g.value
                  return (
                    <button
                      key={g.value}
                      type="button"
                      role="radio"
                      aria-checked={on}
                      title={g.hint}
                      onClick={() => {
                        setGoal(g.value)
                        setGoalMissing(false)
                      }}
                      className={cn(
                        'flex items-center gap-2 rounded-2xl px-3 py-2.5 text-left text-[13px] font-medium ring-1 transition-colors',
                        on ? 'bg-primary/10 text-foreground ring-primary' : 'bg-card ring-border hover:bg-muted',
                      )}
                    >
                      <Icon className={cn('size-4 shrink-0', on ? 'text-primary' : 'text-muted-foreground')} />
                      {g.label}
                    </button>
                  )
                })}
              </div>
              <p className={cn('mt-2 text-xs', goalMissing && !goal ? 'text-bad-fg' : 'text-muted-foreground')}>
                {goal ? POST_GOALS.find((g) => g.value === goal)!.hint + '.' : 'Required. It shapes the AI’s suggestions and lets Data compare goals.'}
              </p>
            </div>

            <div>
              <Label className="mb-2 block font-semibold">Format</Label>
              <div className="flex flex-wrap gap-1.5">
                {PLANNED_FORMATS.map((f) => {
                  const Icon = FORMAT_ICON[f]
                  return (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setFormat(f)}
                      className={cn(
                        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[13px] font-medium ring-1 transition-colors',
                        format === f ? 'bg-primary text-primary-foreground ring-transparent shadow-sm' : 'bg-card text-foreground ring-border hover:bg-muted',
                      )}
                    >
                      <Icon className="size-3.5" />
                      {PLANNED_FORMAT_LABELS[f]}
                    </button>
                  )
                })}
              </div>
              {manual && <p className="mt-2 text-xs text-muted-foreground">The app can’t publish this format yet: it will be posted on LinkedIn by hand.</p>}
            </div>

            <div>
              <Label className="mb-2 block font-semibold">
                {format === 'article' ? 'Intro post text' : 'Post text'} <span className="text-bad-fg">*</span>
              </Label>
              <Textarea
                rows={9}
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder={'Hook line first: it is all most people see.\n\n…\n\n#UAE #EdTech'}
                className="min-h-48 rounded-xl text-[15px] leading-relaxed"
              />
              <div className={cn('mt-1.5 flex justify-between text-xs', over ? 'text-bad-fg' : 'text-muted-foreground')}>
                <span>Hashtags written as #tag become clickable.</span>
                <span className="tabular-nums">
                  {caption.length.toLocaleString()} / {MAX_CHARS.toLocaleString()}
                </span>
              </div>
            </div>

            <FormatFields
              format={format}
              details={details}
              setDetail={setDetail}
              media={media}
              setMedia={setMedia}
              initial={initial}
              file={file}
              setFile={setFile}
              removeImage={removeImage}
              setRemoveImage={setRemoveImage}
              imageAlt={imageAlt}
              setImageAlt={setImageAlt}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label className="mb-2 block font-semibold">
                  {manual ? 'Planned date' : 'Publish at'} ({zoneLabel(zone)})
                </Label>
                <div className="relative">
                  <CalendarClock className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input type="datetime-local" value={scheduled} onChange={(e) => setScheduled(e.target.value)} className="h-10 rounded-xl pl-9" />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {scheduled && zone !== UAE
                    ? `= ${isoToZonedInput(zonedInputToIso(scheduled, zone), UAE).replace('T', ' ')} UAE`
                    : manual
                      ? 'For planning only: the app won’t post this format.'
                      : 'Leave empty to keep it as an unscheduled draft.'}
                </p>
              </div>
              <div className={cn(manual && 'invisible')}>
                <Label className="mb-2 block font-semibold">Who can see it</Label>
                <div className="flex items-center gap-2 [&>label]:flex-1">
                  <Globe className="size-4 shrink-0 text-muted-foreground" />
                  <SimpleSelect
                    value={visibility}
                    onChange={(v) => setVisibility(v as 'PUBLIC' | 'CONNECTIONS')}
                    options={[
                      { value: 'PUBLIC', label: 'Anyone (public)' },
                      { value: 'CONNECTIONS', label: 'Connections only' },
                    ]}
                    className="h-10 w-full flex-1 rounded-xl"
                  />
                </div>
              </div>
            </div>

            <PostingTimeHint accountId={accountId} scheduled={scheduled} zone={zone} onPick={setScheduled} />

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <Label className="mb-2 block font-semibold">Topic</Label>
                <Input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. LMS" className="h-10 rounded-xl" />
              </div>
              <div>
                <Label className="mb-2 block font-semibold">Industry</Label>
                <Input value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="e.g. Education" className="h-10 rounded-xl" />
              </div>
              <div>
                <Label className="mb-2 block font-semibold">CTA</Label>
                <Input value={cta} onChange={(e) => setCta(e.target.value)} placeholder="e.g. Comment LMS" className="h-10 rounded-xl" />
              </div>
            </div>
          </div>

          <footer className="mt-auto flex flex-wrap items-center justify-end gap-3 border-t bg-muted/30 px-6 py-4">
            {!canApprove && canEdit && <span className="mr-auto text-xs text-muted-foreground">An approver checks and publishes it.</span>}
            <Button variant="outline" size="lg" onClick={() => save('draft')} disabled={!canEdit || !!saving}>
              {saving === 'draft' ? 'Saving…' : 'Save as draft'}
            </Button>
            <Button size="lg" onClick={() => save('schedule')} disabled={!canEdit || !!saving}>
              <CalendarClock /> {saving === 'schedule' ? 'Saving…' : canApprove ? 'Schedule post' : 'Send for approval'}
            </Button>
          </footer>
        </section>

        <AiPanel
          accountId={accountId}
          visual={visualFor(format, { file, media, removeImage, initial })}
          ask={params.get('ask') ?? undefined}
          draft={{ format, caption, topic, industry, cta, goal, scheduledAt: scheduled ? zonedInputToIso(scheduled, zone) : null, details }}
          onUsePoll={(question, options) => {
            const before = details
            setDetails((d) => ({ ...d, question, options }))
            toast.success('Poll replaced', { action: { label: 'Undo', onClick: () => setDetails(before) } })
          }}
          onUseText={(text) => {
            const before = caption
            setCaption(text)
            toast.success('Post text replaced', {
              action: { label: 'Undo', onClick: () => setCaption(before) },
            })
          }}
        />
      </div>

      <PreviewDialog
        open={preview}
        onClose={() => setPreview(false)}
        accountName={accountName}
        caption={caption}
        format={format}
        details={details}
        image={file}
        hasStoredImage={!!initial?.has_image && !removeImage}
      />
    </div>
  )
}
