/** "New post" menu (Dashboard and Calendar): write one post in the editor, or import many from Excel. Editors only. */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronDown, FileSpreadsheet, PenLine, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { useAccount } from '@/context/account'
import { useAuth } from '@/context/auth'
import { ImportPlanDialog } from '@/pages/calendar/components/ImportPlanDialog'

export function NewPostMenu({ from }: { from: 'calendar' | 'dashboard' }) {
  const auth = useAuth()
  const navigate = useNavigate()
  const { account } = useAccount()
  const [importing, setImporting] = useState(false)
  if (!auth.can('editor')) return null

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button size="sm" />}>
          <Plus /> New post <ChevronDown className="opacity-70" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuItem onClick={() => navigate(`/create?from=${from}`)}>
            <PenLine />
            <span>
              <span className="block">Write a post</span>
              <span className="block text-xs text-muted-foreground">One post in the editor</span>
            </span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setImporting(true)}>
            <FileSpreadsheet />
            <span>
              <span className="block">Import from Excel</span>
              <span className="block text-xs text-muted-foreground">Plan many posts from a spreadsheet</span>
            </span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {importing && account && <ImportPlanDialog accountId={account.id} accountName={account.name} onClose={() => setImporting(false)} />}
    </>
  )
}
