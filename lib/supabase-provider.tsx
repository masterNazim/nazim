"use client"

import { createClient } from "@supabase/supabase-js"
import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
  useRef,
  useEffect,
  useState,
} from "react"

type SupabaseContextValue = ReturnType<typeof createClient>

const SupabaseContext = createContext<SupabaseContextValue | null>(null)

export function SupabaseProvider({ children }: { children: ReactNode }) {
  // createClient is safe in the browser with anon key
  const supabaseRef = useRef<SupabaseContextValue | null>(null)

  if (!supabaseRef.current) {
    supabaseRef.current = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )
  }

  return (
    <SupabaseContext.Provider value={supabaseRef.current}>
      {children}
    </SupabaseContext.Provider>
  )
}

export function useSupabase() {
  const ctx = useContext(SupabaseContext)
  if (!ctx) throw new Error("useSupabase must be used within a SupabaseProvider")
  return { supabase: ctx }
}
