import { createContext } from 'react'
import type { SimilarResponse } from '@/lib/api'

export const SimilarCtx = createContext<SimilarResponse | undefined>(undefined)
