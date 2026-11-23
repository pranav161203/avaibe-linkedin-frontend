
export const toText = (list: string[]) => list.join('\n')

export const toList = (text: string) => text.split(/[\n,]+/).map((s) => s.trim()).filter(Boolean)
