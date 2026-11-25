import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import type { PlannedDetails, PlannedFormat } from '@/lib/api'
import { FeedPreview } from './FeedPreview'

export function PreviewDialog({
  open,
  onClose,
  accountName,
  caption,
  format,
  details,
  image,
  hasStoredImage,
}: {
  open: boolean
  onClose: () => void
  accountName: string
  caption: string
  format: PlannedFormat
  details: PlannedDetails
  image: File | null
  hasStoredImage: boolean
}) {
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  useEffect(() => {
    if (!image) {
      setImageUrl(null)
      return
    }
    const url = URL.createObjectURL(image)
    setImageUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [image])
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Preview</DialogTitle>
          <DialogDescription>Approximate appearance in the LinkedIn feed. Line breaks and truncation vary by device.</DialogDescription>
        </DialogHeader>
        <FeedPreview accountName={accountName} caption={caption} format={format} details={details} imageSrc={imageUrl} hasStoredImage={hasStoredImage} />
      </DialogContent>
    </Dialog>
  )
}
