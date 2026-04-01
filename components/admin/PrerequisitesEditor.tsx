'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { X, Search, ChevronRight } from 'lucide-react'

type Level = 'topic' | 'subtopic'

interface Props {
  level:      Level
  id:         string
  subjectId?: string  // used to scope subtopic search to same subject
}

interface PrereqRow {
  id:           string
  requiresId:   string
  requiresName: string
  parentName:   string  // subject name for topics, topic name for subtopics
}

interface SearchResult {
  id:         string
  name:       string
  parentName: string
}

export default function PrerequisitesEditor({ level, id, subjectId }: Props) {
  const [prereqs,   setPrereqs]   = useState<PrereqRow[]>([])
  const [query,     setQuery]     = useState('')
  const [results,   setResults]   = useState<SearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [showDrop,  setShowDrop]  = useState(false)
  const [loading,   setLoading]   = useState(true)
  const ref = useRef<HTMLDivElement>(null)

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setShowDrop(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Load existing prerequisites
  useEffect(() => {
    const fetch = async () => {
      const supabase = createClient()

      if (level === 'topic') {
        const { data } = await supabase
          .from('topic_prerequisites')
          .select(`
            id,
            requires_topic_id,
            topics!topic_prerequisites_requires_topic_id_fkey (
              name,
              subjects ( name )
            )
          `)
          .eq('topic_id', id)

        if (data) {
          setPrereqs(data.map((row: any) => ({
            id:           row.id,
            requiresId:   row.requires_topic_id,
            requiresName: row.topics?.name ?? '',
            parentName:   row.topics?.subjects?.name ?? '',
          })))
        }
      } else {
        const { data } = await supabase
          .from('subtopic_prerequisites')
          .select(`
            id,
            requires_subtopic_id,
            subtopics!subtopic_prerequisites_requires_subtopic_id_fkey (
              name,
              topics ( name )
            )
          `)
          .eq('subtopic_id', id)

        if (data) {
          setPrereqs(data.map((row: any) => ({
            id:           row.id,
            requiresId:   row.requires_subtopic_id,
            requiresName: row.subtopics?.name ?? '',
            parentName:   row.subtopics?.topics?.name ?? '',
          })))
        }
      }

      setLoading(false)
    }
    fetch()
  }, [level, id])

  // Search as you type
  useEffect(() => {
    if (!query.trim()) { setResults([]); setShowDrop(false); return }

    const timer = setTimeout(async () => {
      setSearching(true)
      const supabase = createClient()

      if (level === 'topic') {
        const { data } = await supabase
          .from('topics')
          .select('id, name, subjects ( name )')
          .ilike('name', `%${query}%`)
          .neq('id', id)
          .limit(8)

        if (data) {
          setResults(data.map((row: any) => ({
            id:         row.id,
            name:       row.name,
            parentName: row.subjects?.name ?? '',
          })))
          setShowDrop(true)
        }
      } else {
        const { data } = await supabase
          .from('subtopics')
          .select('id, name, topics ( name )')
          .ilike('name', `%${query}%`)
          .neq('id', id)
          .limit(8)

        if (data) {
          setResults(data.map((row: any) => ({
            id:         row.id,
            name:       row.name,
            parentName: row.topics?.name ?? '',
          })))
          setShowDrop(true)
        }
      }

      setSearching(false)
    }, 250)

    return () => clearTimeout(timer)
  }, [query, id, level])

  const handleAdd = async (result: SearchResult) => {
    const supabase = createClient()

    if (level === 'topic') {
      const { data, error } = await supabase
        .from('topic_prerequisites')
        .insert({ topic_id: id, requires_topic_id: result.id })
        .select('id')
        .single()

      if (!error && data) {
        setPrereqs(prev => [...prev, {
          id:           data.id,
          requiresId:   result.id,
          requiresName: result.name,
          parentName:   result.parentName,
        }])
      }
    } else {
      const { data, error } = await supabase
        .from('subtopic_prerequisites')
        .insert({ subtopic_id: id, requires_subtopic_id: result.id })
        .select('id')
        .single()

      if (!error && data) {
        setPrereqs(prev => [...prev, {
          id:           data.id,
          requiresId:   result.id,
          requiresName: result.name,
          parentName:   result.parentName,
        }])
      }
    }

    setQuery('')
    setResults([])
    setShowDrop(false)
  }

  const handleRemove = async (prereqId: string) => {
    const supabase = createClient()
    const table    = level === 'topic'
      ? 'topic_prerequisites'
      : 'subtopic_prerequisites'

    await supabase.from(table).delete().eq('id', prereqId)
    setPrereqs(prev => prev.filter(p => p.id !== prereqId))
  }

  if (loading) return <p className="text-xs text-gray-400">Loading…</p>

  return (
    <div className="flex flex-col gap-3">

      {/* Existing prerequisites */}
      {prereqs.length === 0 && (
        <p className="text-xs text-gray-400 italic">
          No prerequisites — this {level} is self-contained.
        </p>
      )}

      {prereqs.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {prereqs.map(p => (
            <div
              key={p.id}
              className="flex items-center gap-1.5 bg-white border border-gray-200 rounded px-3 py-1.5 text-xs text-gray-700 group"
            >
              <span className="text-gray-400">{p.parentName}</span>
              <ChevronRight size={10} className="text-gray-300" />
              <span className="font-medium">{p.requiresName}</span>
              <button
                type="button"
                onClick={() => handleRemove(p.id)}
                className="text-gray-300 hover:text-red-400 transition-colors ml-1 opacity-0 group-hover:opacity-100"
              >
                <X size={11} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Search input */}
      <div className="relative" ref={ref}>
        <div className="flex items-center gap-2 border border-gray-200 rounded px-3 py-2 bg-white focus-within:ring-2 focus-within:ring-gray-900 transition-all">
          <Search size={12} className="text-gray-400 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onFocus={() => results.length > 0 && setShowDrop(true)}
            placeholder={`Search for a ${level} to add as prerequisite…`}
            className="flex-1 text-sm text-gray-900 placeholder-gray-300 outline-none bg-transparent"
          />
          {searching && (
            <span className="text-xs text-gray-400">Searching…</span>
          )}
        </div>

        {/* Dropdown */}
        {showDrop && results.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded shadow-lg z-20 overflow-hidden">
            {results
              .filter(r => !prereqs.find(p => p.requiresId === r.id))
              .map(result => (
                <button
                  key={result.id}
                  type="button"
                  onClick={() => handleAdd(result)}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-stone-50 transition-colors border-b border-gray-100 last:border-0"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {result.name}
                    </p>
                    <p className="text-xs text-gray-400">{result.parentName}</p>
                  </div>
                </button>
              ))
            }
          </div>
        )}

        {showDrop && query.trim() && results.length === 0 && !searching && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded shadow-lg z-20 px-3 py-3">
            <p className="text-xs text-gray-400">No results for "{query}"</p>
          </div>
        )}
      </div>
    </div>
  )
}