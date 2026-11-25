const MAX_SIDE = 1568
const MAX_PDF = 20 * 1024 * 1024

export async function prepareForAI(file: File): Promise<File> {
  if (file.type === 'application/pdf') {
    if (file.size > MAX_PDF) throw new Error('PDF files must be 20 MB or smaller.')
    return file
  }
  if (!file.type.startsWith('image/')) throw new Error('Only images and PDF files can be analysed. Video is not supported.')
  const url = URL.createObjectURL(file)
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image()
      i.onload = () => resolve(i)
      i.onerror = () => reject(new Error('The image could not be read.'))
      i.src = url
    })
    const scale = Math.min(1, MAX_SIDE / Math.max(img.naturalWidth, img.naturalHeight))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(img.naturalWidth * scale)
    canvas.height = Math.round(img.naturalHeight * scale)
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
    const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('The image could not be processed.'))), 'image/jpeg', 0.85))
    return new File([blob], file.name.replace(/\.\w+$/, '') + '.jpg', { type: 'image/jpeg' })
  } finally {
    URL.revokeObjectURL(url)
  }
}

export async function fetchAsFile(url: string, name: string): Promise<File> {
  const res = await fetch(url, { credentials: 'same-origin' })
  if (!res.ok) throw new Error('The attached file could not be loaded.')
  const blob = await res.blob()
  return new File([blob], name, { type: blob.type || (name.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/jpeg') })
}
