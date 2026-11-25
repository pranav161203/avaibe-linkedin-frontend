import { toast } from 'sonner'
import { Clapperboard, Copy, ExternalLink, ImageIcon, Layers } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { IconTile } from '@/components/common'
import type { CarouselPrompts, VisualPrompt } from '@/lib/api'

const DREAMINA = 'https://dreamina.capcut.com/'

async function copyText(text: string, what = 'Prompt') {
  try {
    await navigator.clipboard.writeText(text)
    toast.success(`${what} copied`)
  } catch {
    toast.error('Copy failed. Select the text manually.')
  }
}

function ToolLink({ name }: { name: string }) {
  return (
    <a href={DREAMINA} target="_blank" rel="noreferrer" className="inline-flex items-center gap-0.5 underline">
      {name} <ExternalLink className="size-3" />
    </a>
  )
}

export function VisualPromptView({ kind, prompt }: { kind: 'image' | 'video'; prompt: VisualPrompt }) {
  return (
    <div className="rounded-xl p-4 ring-1 ring-border">
      <div className="mb-3 flex items-start gap-3">
        <IconTile icon={kind === 'video' ? Clapperboard : ImageIcon} />
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold">{kind === 'video' ? 'Video prompt' : 'Image prompt'}</div>
          <div className="text-xs text-muted-foreground">
            Use in <ToolLink name={kind === 'video' ? 'Seedance' : 'Seedream'} /> or a similar tool, then upload the {kind}.
          </div>
        </div>
      </div>
      <div className="space-y-3">
        <PromptBox text={prompt.prompt} />
        <Chips label="Settings" items={prompt.settings} />
        <Tips items={prompt.tips} />
      </div>
    </div>
  )
}

export function SlidePromptsView({ prompts }: { prompts: CarouselPrompts }) {
  return (
    <div className="rounded-xl p-4 ring-1 ring-border">
      <div className="mb-3 flex items-start gap-3">
        <IconTile icon={Layers} />
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold">Slide prompts</div>
          <div className="text-xs text-muted-foreground">
            Create each slide in <ToolLink name="Seedream" /> or a similar tool, combine them into one PDF and upload it.
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => copyText(prompts.slides.map((s, i) => `Slide ${i + 1}: ${s.prompt}`).join('\n\n'), 'All slide prompts')}>
          <Copy /> Copy all
        </Button>
      </div>
      <div className="space-y-3">
        <p className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Style for every slide:</span> {prompts.style}
        </p>
        <p className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Document title:</span> {prompts.document_title}
        </p>
        <ol className="space-y-2">
          {prompts.slides.map((s, i) => (
            <li key={i} className="rounded-xl bg-muted/30 p-3 ring-1 ring-border">
              <div className="mb-2 text-sm">
                <span className="mr-2 text-xs font-semibold text-muted-foreground">{i + 1}</span>
                <span className="font-semibold">{s.headline}</span>
                {s.body && <span className="text-muted-foreground"> · {s.body}</span>}
              </div>
              <PromptBox text={s.prompt} small />
            </li>
          ))}
        </ol>
        <Tips items={prompts.tips} />
      </div>
    </div>
  )
}

function PromptBox({ text, small }: { text: string; small?: boolean }) {
  return (
    <div className={`relative rounded-lg bg-card px-3 py-2.5 pr-10 leading-relaxed whitespace-pre-wrap ring-1 ring-border ${small ? 'text-xs' : 'text-sm'}`}>
      {text}
      <button type="button" onClick={() => copyText(text)} aria-label="Copy prompt" className="absolute top-2 right-2 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground">
        <Copy className="size-4" />
      </button>
    </div>
  )
}

function Chips({ label, items }: { label: string; items: string[] }) {
  if (!items.length) return null
  return (
    <div className="flex flex-wrap items-center gap-1.5 text-xs">
      <span className="font-medium">{label}:</span>
      {items.map((s) => (
        <span key={s} className="rounded-full bg-muted/50 px-2.5 py-1 ring-1 ring-border">
          {s}
        </span>
      ))}
    </div>
  )
}

function Tips({ items }: { items: string[] }) {
  if (!items.length) return null
  return (
    <ul className="list-disc space-y-0.5 pl-5 text-xs text-muted-foreground">
      {items.map((t) => (
        <li key={t}>{t}</li>
      ))}
    </ul>
  )
}
