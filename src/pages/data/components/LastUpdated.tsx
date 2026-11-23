import { format, parseISO } from 'date-fns'
import { useTz } from '@/context/timezone'
import { IMPORT_LABEL } from '../constants'
import { useGetLastImports } from '../queries'

export function LastUpdated({ accountId, kind }: { accountId: number; kind: keyof typeof IMPORT_LABEL }) {
  const tz = useTz()
  const { data } = useGetLastImports(accountId)
  const last = data?.[kind]
  return (
    <span className="ml-auto self-center pb-2.5 text-xs text-muted-foreground" title={last ? `File: ${last.file}` : undefined}>
      {last
        ? `${last.at ? `Updated ${tz.dateTime(last.at)} · ` : ''}LinkedIn ${IMPORT_LABEL[kind]} export of ${format(parseISO(last.exported_on), 'd MMM yyyy')}`
        : `No ${IMPORT_LABEL[kind]} export imported yet`}
    </span>
  )
}
