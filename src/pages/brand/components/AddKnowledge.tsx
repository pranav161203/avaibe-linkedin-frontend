import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { FileText, FileUp, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { fmtNumber } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useAddKnowledge } from '../queries'
import { AppliesTo } from './AppliesTo'

const ACCEPT = '.txt,.md,.pdf,.docx'

export function AddKnowledge({ maxChars }: { maxChars: number }) {
  const [mode, setMode] = useState<'text' | 'file'>('text')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [accountIds, setAccountIds] = useState<number[]>([])
  const input = useRef<HTMLInputElement>(null)
  const add = useAddKnowledge()

  const reset = () => {
    setTitle('')
    setContent('')
    setFile(null)
  }
  const submit = () =>
    add.mutate(mode === 'file' ? { title: title.trim(), file: file!, accountIds } : { title: title.trim(), content, accountIds }, {
      onSuccess: (s) => {
        toast.success(`“${s.title}” added · ${s.chunks} passage${s.chunks === 1 ? '' : 's'}`)
        reset()
      },
      onError: (e) => toast.error(e.message),
    })
  const ready = mode === 'file' ? !!file : !!title.trim() && !!content.trim() && content.length <= maxChars

  return (
    <section className="rounded-[1.8rem] bg-card p-5">
      <h2 className="mb-3 text-base font-semibold">Add knowledge</h2>
      <div role="tablist" className="mb-4 grid grid-cols-2 gap-1 rounded-lg bg-secondary p-1">
        {(
          [
            ['text', 'Paste text', FileText],
            ['file', 'Upload file', FileUp],
          ] as const
        ).map(([m, label, Icon]) => (
          <button
            key={m}
            role="tab"
            aria-selected={mode === m}
            type="button"
            onClick={() => setMode(m)}
            className={cn(
              'inline-flex items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-medium transition-colors',
              mode === m ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <Icon className="size-3.5" /> {label}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="kb-title">Title{mode === 'file' && <span className="font-normal text-muted-foreground"> (optional)</span>}</Label>
          <Input
            id="kb-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={200}
            placeholder={mode === 'file' ? 'Defaults to the file name' : 'For example: Services overview'}
          />
        </div>

        {mode === 'text' ? (
          <div className="space-y-1.5">
            <Label htmlFor="kb-content">Content</Label>
            <Textarea
              id="kb-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={9}
              placeholder={'## ERP for trading companies\nWhat we build, for whom, a recent project and its result.\n\n## School systems (LMS)\n…'}
              className="font-mono text-xs"
            />
            <p className={cn('text-xs text-muted-foreground tabular-nums', content.length > maxChars && 'text-bad-fg')}>
              {fmtNumber(content.length)} / {fmtNumber(maxChars)} characters. Use ## headings to separate sections.
            </p>
          </div>
        ) : (
          <div className="space-y-1.5">
            <Label>File</Label>
            <input
              ref={input}
              type="file"
              accept={ACCEPT}
              className="hidden"
              onChange={(e) => {
                setFile(e.target.files?.[0] ?? null)
                e.target.value = ''
              }}
            />
            <button
              type="button"
              onClick={() => input.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault()
                const f = e.dataTransfer.files?.[0]
                if (f) setFile(f)
              }}
              className="flex w-full flex-col items-center gap-1.5 rounded-xl border border-dashed bg-muted/30 px-4 py-6 text-center transition-colors hover:bg-accent"
            >
              <Upload className="size-5 text-muted-foreground" />
              <span className="text-sm font-medium">{file ? file.name : 'Choose a file or drag it here'}</span>
              <span className="text-xs text-muted-foreground">.txt, .md, .pdf or .docx, up to 5 MB. Scanned PDFs are not supported.</span>
            </button>
          </div>
        )}

        <AppliesTo value={accountIds} onChange={setAccountIds} />

        <p className="text-[11px] text-muted-foreground">Company information only. Do not include personal details or confidential information.</p>
        <Button onClick={submit} disabled={!ready || add.isPending} className="w-full">
          {add.isPending ? (mode === 'file' ? 'Processing file…' : 'Adding…') : 'Add to knowledge base'}
        </Button>
      </div>
    </section>
  )
}
