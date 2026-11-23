import { Link } from 'react-router-dom'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'

const SECTIONS: { title: string; items: [string, string][] }[] = [
  {
    title: 'Where things are',
    items: [
      ['Dashboard', 'A quick read of the period: headline numbers, best posts, who your audience is and what needs doing.'],
      ['Data', 'The detail: every post (Posts), page totals and the chart (Content), page visitors and followers. Import LinkedIn’s export from the Posts tab.'],
      ['Suggestions', 'What to post next: topics, formats, timing and calls to action, from your own numbers and, when you click Generate ideas, from Claude.'],
      ['Calendar', 'Posts, holidays and events by day, with the best times to post. Click a day to plan a post for it.'],
      ['Publishing', 'Every post, unpublished, scheduled or published. Edit opens the editor (new posts start from the Calendar): write and check it (the AI, Analyse and Chat, only runs when you click), then approve to preview and publish now or at its time. Hand-posted formats are marked as posted.'],
      ['Brand · Leads & sales', 'Brand: suggestions and Competitors. Leads & sales: suggestions, the Leads log, the Pipeline (the same leads, by stage) and Results (which posts bring leads and money). Leads are entered by the team: LinkedIn doesn’t share enquiries.'],
    ],
  },
  {
    title: 'Where the numbers come from',
    items: [
      ['LinkedIn export (now)', 'Content, Followers and Visitors files from the page’s Analytics. They give post dates but not times, and totals rather than 24h/48h/7-day figures.'],
      ['LinkedIn API (later)', 'Once LinkedIn approves API access, numbers sync by themselves, with posting times and figures at each age.'],
      ['Missing numbers', 'A “—” means LinkedIn didn’t provide that number, not that it was zero. “Too few to compare” means the numbers are too small for a fair % change.'],
    ],
  },
  {
    title: 'The AI',
    items: [
      ['When it runs', 'Only when someone clicks Analyse, Start session, or sends a chat message. Opening a page never uses it.'],
      ['Limits', 'Per account, per 24 hours: 40 analyses, 80 chat messages. Each run’s cost is shown and recorded.'],
      ['What it won’t do', 'Invent numbers, client names or results. It asks instead, and flags claims to check. Always proofread before posting.'],
    ],
  },
]

export function HelpDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Help</DialogTitle>
          <DialogDescription>How the app is organised, where its numbers come from, and how the AI is used.</DialogDescription>
        </DialogHeader>
        <div className="space-y-5">
          <p className="rounded-lg border px-3 py-2 text-xs text-muted-foreground">
            Something not working, or access you need? Ask an admin. Your profile, appearance and time zone are under your picture at the
            top right; workspace rules are in{' '}
            <Link to="/settings" onClick={onClose} className="underline">
              Settings
            </Link>
            .
          </p>
          {SECTIONS.map((s) => (
            <section key={s.title}>
              <h3 className="mb-2 text-sm font-semibold">{s.title}</h3>
              <dl className="space-y-2">
                {s.items.map(([term, text]) => (
                  <div key={term} className="rounded-lg bg-muted/40 px-3 py-2">
                    <dt className="text-sm font-medium">{term}</dt>
                    <dd className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{text}</dd>
                  </div>
                ))}
              </dl>
            </section>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
