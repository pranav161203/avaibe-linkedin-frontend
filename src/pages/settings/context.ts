import { createContext, useContext } from 'react'

/** The company whose settings the Settings tabs read and save. Undefined = your own (everyone except owners). */
export const SettingsCompany = createContext<number | undefined>(undefined)
export const useSettingsCompany = () => useContext(SettingsCompany)
