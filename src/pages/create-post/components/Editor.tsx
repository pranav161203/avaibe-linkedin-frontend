import { useState } from 'react'
import { DateTimePicker } from '@/components/date-time-picker'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { CalendarClock, ChevronRight, Eye, Globe, PenSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select'
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
  // Where the editor was opened from: the back link and "save" return there
  const origin = params.get('from') === 'calendar' ? { to: '/calendar', label: 'Calendar' } : params.get('from') === 'dashboard' ? { to: '/', label: 'Dashboard' } : { to: '/publishing', label: 'Publishing' }
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
  const [topic, setTopic] = useState(initial?.topic ?? params.get('topic')?.slice(0, 200) ?? '')
  const [industry, setIndustry] = useState(initial?.industry ?? '')
  const [cta, setCta] = useState(initial?.cta ?? '')
  const [imageAlt, setImageAlt] = useState(initial?.image_alt ?? '')
  const [file, setFile] = useState<File | null>(null)
  const [removeImage, setRemoveImage] = useState(false)
  const [saving, setSaving] = useState<'draft' | 'schedule' | null>(null)
  const savePost = useSavePlannedPost(accountId)
  const [preview, setPreview] = useState(false)
  const canApprove = auth.can('editor')
  const canEdit = auth.can('editor')
  const over = caption.length > MAX_CHARS

  const save = async (mode: 'draft' | 'schedule') => {
    if (!goal) {
      setGoalMissing(true)
      document.getElementById('goal')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return toast.error('Select a goal for the post')
    }
    if (!caption.trim()) return toast.error('Add post text first')
    if (over) return toast.error(`LinkedIn allows ${MAX_CHARS.toLocaleString()} characters`)
    const options = (details.options ?? []).map((o) => o.trim()).filter(Boolean)
    if (format === 'poll' && (!details.question?.trim() || options.length < 2)) return toast.error('A poll needs a question and at least 2 options')
    if (mode === 'schedule' && !scheduled) return toast.error(manual ? 'Select a planned date' : 'Select a date and time to schedule')
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
          manual ? 'Planned. Post it manually on LinkedIn at the planned time, then mark it as posted.' : 'Scheduled for automatic publishing.',
        )
      } else if (mode === 'schedule') {
        toast.success('Submitted for approval. It will be scheduled once approved.')
      } else {
        toast.success(initial?.status === 'approved' ? 'Saved as unpublished. The post is no longer scheduled.' : 'Draft saved')
      }
      navigate(origin.to)
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setSaving(null)
    }
  }

  return (
    <div className="mx-auto max-w-page">
      <nav className="mb-1 flex items-center gap-1.5 text-sm text-muted-foreground" aria-label="Breadcrumb">
        {(initial || origin.to !== '/publishing') && <BackButton fallback={origin.to} />}
        <Link to={origin.to} className="hover:text-foreground">
          {origin.label}
        </Link>
        <ChevronRight className="size-3.5" />
        <span className="text-foreground">{initial ? 'Edit post' : 'Create post'}</span>
        {initial?.ref && <PostRef id={initial.ref} className="ml-1" />}
      </nav>
      <h1 className="text-[32px] leading-tight font-semibold tracking-tight">{initial ? 'Edit post' : 'Create post'}</h1>
      <p className="mt-1 mb-6 text-sm text-muted-foreground">
        Draft, review and schedule a LinkedIn post for {accountName}.
      </p>
      {initial?.status === 'approved' && (
        <p className="-mt-3 mb-5 rounded-xl bg-warn/10 px-3 py-2 text-xs ring-1 ring-warn/40">
          This post is scheduled. Saving changes removes it from the schedule
          {canApprove ? ' until it is scheduled again' : ' until it is approved again'}.
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
            {/* Goal and Format side by side, as dropdowns */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div id="goal" className="flex scroll-mt-24 items-center gap-3">
                <Label className="shrink-0 font-semibold">
                  Goal <span className="text-bad-fg">*</span>
                </Label>
                <Select
                  value={goal}
                  onValueChange={(v) => {
                    if (!v) return
                    setGoal(v as PostGoal)
                    setGoalMissing(false)
                  }}
                >
                  <SelectTrigger aria-label="Goal of the post" className={cn('h-10 min-w-0 flex-1 rounded-xl', goalMissing && !goal && 'ring-2 ring-bad/50')}>
                    {goal ? (
                      <span className="flex items-center gap-2">
                        <GoalIconFor goal={goal} />
                        {POST_GOALS.find((g) => g.value === goal)!.label}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">Choose a goal</span>
                    )}
                  </SelectTrigger>
                  <SelectContent>
                    {POST_GOALS.map((g) => (
                      <SelectItem key={g.value} value={g.value}>
                        <span className="flex items-center gap-2">
                          <GoalIconFor goal={g.value} />
                          {g.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-3">
                <Label className="shrink-0 font-semibold">Format</Label>
                <Select value={format} onValueChange={(v) => v && setFormat(v as PlannedFormat)}>
                  <SelectTrigger aria-label="Format" className="h-10 min-w-0 flex-1 rounded-xl">
                    <span className="flex items-center gap-2">
                      <FormatIconFor format={format} />
                      {PLANNED_FORMAT_LABELS[format]}
                    </span>
                  </SelectTrigger>
                  <SelectContent>
                    {PLANNED_FORMATS.map((f) => (
                      <SelectItem key={f} value={f}>
                        <span className="flex items-center gap-2">
                          <FormatIconFor format={f} />
                          {PLANNED_FORMAT_LABELS[f]}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {manual && <p className="-mt-3 text-xs text-muted-foreground">This format must be posted manually on LinkedIn.</p>}

            <div>
              <Label className="mb-2 block font-semibold">
                {format === 'article' ? 'Intro post text' : 'Post text'} <span className="text-bad-fg">*</span>
              </Label>
              <Textarea
                rows={9}
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder={'Start with a strong opening line.\n\n…\n\n#UAE #EdTech'}
                className="min-h-48 rounded-xl text-[15px] leading-relaxed"
              />
              <div className={cn('mt-1.5 flex justify-between text-xs', over ? 'text-bad-fg' : 'text-muted-foreground')}>
                <span>Hashtags in the #tag format are linked on LinkedIn.</span>
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
                <DateTimePicker
                  value={scheduled}
                  onChange={setScheduled}
                  zoneLabel={zoneLabel(zone)}
                  placeholder={manual ? 'Select a planned date' : 'Not scheduled yet'}
                  minDate={initial ? undefined : new Date()}
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  {scheduled && zone !== UAE
                    ? `= ${isoToZonedInput(zonedInputToIso(scheduled, zone), UAE).replace('T', ' ')} UAE`
                    : manual
                      ? 'For planning only. This format is posted manually.'
                      : 'Leave empty to save as an unscheduled draft.'}
                </p>
              </div>
              <div className={cn(manual && 'invisible')}>
                <Label className="mb-2 block font-semibold">Visibility</Label>
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
            {!canApprove && canEdit && <span className="mr-auto text-xs text-muted-foreground">Requires approval before publishing.</span>}
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

function GoalIconFor({ goal }: { goal: PostGoal }) {
  const Icon = GOAL_ICON[goal]
  return <Icon className="size-4 shrink-0 text-muted-foreground" />
}

function FormatIconFor({ format }: { format: PlannedFormat }) {
  const Icon = FORMAT_ICON[format]
  return <Icon className="size-4 shrink-0 text-muted-foreground" />
}
