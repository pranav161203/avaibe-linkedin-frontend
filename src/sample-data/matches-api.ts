import type * as RealApi from '@/lib/api'
import * as SampleApi from './api'

// Type check only: fails to compile if the sample data stops matching the real api (a function missing or different)
export const sampleDataMatchesApi: typeof RealApi = SampleApi
