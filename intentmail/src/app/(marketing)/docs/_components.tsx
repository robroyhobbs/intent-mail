'use client'

import { useState } from 'react'
import { Check, Copy } from 'lucide-react'

const methodColors: Record<string, string> = {
  GET: 'bg-emerald-500/10 text-emerald-700 border-emerald-200',
  POST: 'bg-blue-500/10 text-blue-700 border-blue-200',
  PUT: 'bg-amber-500/10 text-amber-700 border-amber-200',
  PATCH: 'bg-purple-500/10 text-purple-700 border-purple-200',
  DELETE: 'bg-red-500/10 text-red-700 border-red-200',
}

export function CodeBlock({
  code,
  language,
}: {
  code: string
  language: string
}) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="group relative my-4 rounded-lg border border-slate-800 bg-slate-950">
      <div className="flex items-center justify-between border-b border-slate-800 px-4 py-2">
        <span className="text-xs font-medium text-slate-400">{language}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 rounded px-2 py-1 text-xs text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-200"
        >
          {copied ? (
            <>
              <Check className="h-3 w-3" /> Copied
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" /> Copy
            </>
          )}
        </button>
      </div>
      <pre className="overflow-x-auto p-4">
        <code className="text-[13px] leading-relaxed text-slate-300">
          {code}
        </code>
      </pre>
    </div>
  )
}

export function EndpointHeader({
  method,
  path,
  description,
}: {
  method: string
  path: string
  description: string
}) {
  const colors = methodColors[method] || methodColors.GET

  return (
    <div className="mb-4 mt-8 flex flex-wrap items-start gap-3 border-b border-slate-200 pb-4">
      <span
        className={`inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-bold ${colors}`}
      >
        {method}
      </span>
      <div>
        <code className="text-sm font-semibold text-slate-900">{path}</code>
        <p className="mt-1 text-sm text-slate-600">{description}</p>
      </div>
    </div>
  )
}

export function ParamTable({
  params,
}: {
  params: {
    name: string
    type: string
    required: boolean
    description: string
  }[]
}) {
  if (params.length === 0) return null

  return (
    <div className="my-4 overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-left">
            <th className="pb-2 pr-4 font-semibold text-slate-700">Name</th>
            <th className="pb-2 pr-4 font-semibold text-slate-700">Type</th>
            <th className="pb-2 pr-4 font-semibold text-slate-700">Required</th>
            <th className="pb-2 font-semibold text-slate-700">Description</th>
          </tr>
        </thead>
        <tbody>
          {params.map((p, i) => (
            <tr
              key={p.name}
              className={i % 2 === 0 ? 'bg-slate-50/50' : ''}
            >
              <td className="py-2 pr-4">
                <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-medium text-slate-800">
                  {p.name}
                </code>
              </td>
              <td className="py-2 pr-4 text-slate-600">{p.type}</td>
              <td className="py-2 pr-4">
                {p.required ? (
                  <span className="text-xs font-medium text-red-600">
                    Required
                  </span>
                ) : (
                  <span className="text-xs text-slate-400">Optional</span>
                )}
              </td>
              <td className="py-2 text-slate-600">{p.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function ResponseBlock({
  success,
  error,
}: {
  success: string
  error?: string
}) {
  return (
    <div className="my-4 space-y-3">
      <div>
        <h4 className="mb-2 text-sm font-semibold text-emerald-700">
          Success Response
        </h4>
        <CodeBlock code={success} language="json" />
      </div>
      {error && (
        <div>
          <h4 className="mb-2 text-sm font-semibold text-red-700">
            Error Response
          </h4>
          <CodeBlock code={error} language="json" />
        </div>
      )}
    </div>
  )
}
