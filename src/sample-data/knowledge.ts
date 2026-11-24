/** Knowledge base in the browser (sample data): the same chunking rules as the backend, and a simple word search. */

const CHUNK_TARGET = 900
const CHUNK_MAX = 1400
const HEADING = /^\s{0,3}(#{1,6})\s+(.+?)\s*#*\s*$/

export const cleanText = (t: string) =>
  t
    .replace(/\r\n?/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()

function splitLong(p: string): string[] {
  if (p.length <= CHUNK_MAX) return [p]
  const parts: string[] = []
  let cur = ''
  for (const s of p.split(/(?<=[.!?])\s+/)) {
    if (cur && cur.length + s.length + 1 > CHUNK_TARGET) {
      parts.push(cur)
      cur = s
    } else cur = `${cur} ${s}`.trim()
    while (cur.length > CHUNK_MAX) {
      let cut = cur.lastIndexOf(' ', CHUNK_MAX)
      if (cut <= CHUNK_TARGET / 2) cut = CHUNK_MAX
      parts.push(cur.slice(0, cut).trim())
      cur = cur.slice(cut).trim()
    }
  }
  if (cur) parts.push(cur)
  return parts
}

export function chunkText(text: string): { heading: string; text: string }[] {
  const sections: { heading: string; paras: string[] }[] = [{ heading: '', paras: [] }]
  // A heading always starts its own block, even with no blank line around it
  for (const block of cleanText(text)
    .replace(/^(\s{0,3}#{1,6}\s+.+)$/gm, '\n$1\n')
    .split(/\n\s*\n/)
    .map((b) => b.trim())) {
    const lines = block.split('\n')
    const m = HEADING.exec(lines[0])
    if (m) {
      sections.push({ heading: m[2].trim().slice(0, 200), paras: [] })
      const rest = lines.slice(1).join('\n').trim()
      if (rest) sections[sections.length - 1].paras.push(rest)
    } else if (block.trim()) sections[sections.length - 1].paras.push(block.trim())
  }
  const out: { heading: string; text: string }[] = []
  for (const s of sections) {
    let cur = ''
    for (const p of s.paras)
      for (const piece of splitLong(p)) {
        if (cur && cur.length + piece.length + 2 > CHUNK_TARGET) {
          out.push({ heading: s.heading, text: cur })
          cur = piece
        } else cur = cur ? `${cur}\n\n${piece}` : piece
      }
    if (cur) out.push({ heading: s.heading, text: cur })
  }
  return out
}

export const sectionCount = (text: string) => cleanText(text).split('\n').filter((l) => HEADING.test(l)).length

const STOP = new Set(
  'a an and are as at be but by can do does for from has have how i if in into is it its me my of on or our so than that the their them then there these they this to us was we what when where which who why will with you your'.split(
    ' ',
  ),
)
const terms = (t: string) => (t.toLowerCase().match(/[a-z0-9]+(?:'[a-z]+)?/g) ?? []).filter((w) => !STOP.has(w) && w.length > 1)

export function scoreChunk(query: string, heading: string, text: string): number {
  const q = [...new Set(terms(query))]
  const words = terms(`${heading} ${heading} ${text}`)
  if (!q.length || !words.length) return 0
  const hits = q.reduce((n, t) => n + words.filter((w) => w === t).length, 0)
  const covered = q.filter((t) => words.includes(t)).length
  return hits ? covered + hits / words.length : 0
}
