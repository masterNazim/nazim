"use client"

/**
 * Lightweight React context around the already-configured Supabase client
 * (exported from `@/lib/supabase`).
 *
 * It lets components do:
 *   const { supabase } = useSupabase()
 * instead of importing the client everywhere.
 */
import { createContext, useContext, useMemo } from "react"
import { supabase } from "./supabase"

const SupabaseCtx = createContext({ supabase })

export function SupabaseProvider({ children }) {
  /* supabase client is a singleton – memoise the context value once */
  const value = useMemo(() => ({ supabase }), [])

  return <SupabaseCtx.Provider value={value}>{children}</SupabaseCtx.Provider>
}

/**
 * Hook that gives access to the shared Supabase client
 * and keeps type safety / IntelliSense.
 */
export function useSupabase() {
  return useContext(SupabaseCtx)
}

/* Optional default export so users can `import SupabaseProvider from '@/lib/supabase-provider'` */
export default SupabaseProvider
