'use client'

import { useState } from 'react'
import { Menu, X } from 'lucide-react'

export function SidebarToggle({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="fixed top-20 left-4 z-40 rounded-lg border border-slate-200 bg-white p-2 shadow-sm lg:hidden"
        aria-label={open ? 'Close sidebar' : 'Open sidebar'}
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/20 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}
      <aside
        className={`fixed top-16 left-0 z-30 h-[calc(100vh-4rem)] w-64 overflow-y-auto border-r border-slate-200 bg-slate-50 p-4 transition-transform lg:sticky lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {children}
      </aside>
    </>
  )
}
