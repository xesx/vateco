"use client"

import { useRouter, useParams } from "next/navigation"
import { useWorkflowVariant, useUpdateWorkflowVariant, useDeleteWorkflowVariant } from "@/hooks/use-workflow-variant"
import { useState, useEffect, useRef } from "react"
import { ArrowLeft } from 'lucide-react'
import { useWorkflowVariantTags, useAddWorkflowVariantTag, useDeleteWorkflowVariantTag } from '@/hooks/use-workflow-variant-tags'
import { Trash2 } from 'lucide-react'
import { useWorkflowVariantParams } from '@/hooks/use-workflow-variant-params'
import { useAllTags } from '@/hooks/use-all-tags'

export default function WorkflowVariantPage() {
  const router = useRouter()
  const params = useParams()
  const id = params?.id ? Number(params.id) : null

  const { data: variant, isLoading, error } = useWorkflowVariant(id)
  const updateVariant = useUpdateWorkflowVariant()
  const deleteVariant = useDeleteWorkflowVariant()
  const { data: tags, isLoading: tagsLoading } = useWorkflowVariantTags(id)
  const addTag = useAddWorkflowVariantTag()
  const deleteTag = useDeleteWorkflowVariantTag()
  const { data: workflowParams, isLoading: paramsLoading } = useWorkflowVariantParams(id)
  const { data: allTags } = useAllTags()
  const [newTag, setNewTag] = useState('')

  // Inline edit states
  const [editName, setEditName] = useState(false)
  const [editDescription, setEditDescription] = useState(false)
  const [nameValue, setNameValue] = useState('')
  const [descriptionValue, setDescriptionValue] = useState('')
  const nameInputRef = useRef<HTMLInputElement>(null)
  const descInputRef = useRef<HTMLInputElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)

  useEffect(() => {
    if (variant) {
      if (nameValue !== variant.name) setNameValue(variant.name)
      if (descriptionValue !== (variant.description ?? "")) setDescriptionValue(variant.description ?? "")
    }
  }, [variant, nameValue, descriptionValue])

  useEffect(() => {
    if (editName && nameInputRef.current) {
      nameInputRef.current.focus()
    }
  }, [editName])
  useEffect(() => {
    if (editDescription && descInputRef.current) {
      descInputRef.current.focus()
    }
  }, [editDescription])

  useEffect(() => {
    if (!allTags) {
      setSuggestions([])
      setShowSuggestions(false)
      setHighlightedIndex(-1)
      return
    }
    let filtered: string[]
    if (!newTag.trim()) {
      filtered = allTags.filter(t => !(tags?.some(tag => tag.tag === t)))
    } else {
      filtered = allTags.filter(
        t => t.toLowerCase().includes(newTag.trim().toLowerCase()) && !(tags?.some(tag => tag.tag === t))
      )
    }
    setSuggestions(filtered)
    setShowSuggestions(filtered.length > 0)
    setHighlightedIndex(-1)
  }, [newTag, allTags, tags])

  const handleUpdateName = async () => {
    if (!id || !nameValue.trim() || nameValue === variant?.name) {
      setEditName(false)
      setNameValue(variant?.name ?? '')
      return
    }
    await updateVariant.mutateAsync({ workflowVariantId: id, name: nameValue, description: variant?.description ?? '' })
    setEditName(false)
  }
  const handleUpdateDescription = async () => {
    if (!id || descriptionValue === (variant?.description ?? '')) {
      setEditDescription(false)
      setDescriptionValue(variant?.description ?? '')
      return
    }
    await updateVariant.mutateAsync({ workflowVariantId: id, name: variant?.name ?? '', description: descriptionValue })
    setEditDescription(false)
  }
  const handleDelete = async () => {
    if (!id) return
    if (window.confirm("Удалить вариант?")) {
      await deleteVariant.mutateAsync(id)
      router.push("/workflow-variants")
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    setNewTag(suggestion)
    setShowSuggestions(false)
    setHighlightedIndex(-1)
    setTimeout(() => {
      inputRef.current?.focus()
    }, 0)
  }

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlightedIndex(idx => (idx + 1) % suggestions.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlightedIndex(idx => (idx - 1 + suggestions.length) % suggestions.length)
    } else if (e.key === 'Enter' && highlightedIndex >= 0) {
      e.preventDefault()
      setNewTag(suggestions[highlightedIndex])
      setShowSuggestions(false)
      setHighlightedIndex(-1)
    } else if (e.key === 'Escape') {
      setShowSuggestions(false)
      setHighlightedIndex(-1)
    }
  }

  if (isLoading) return <div className="py-8 text-center">Загрузка...</div>
  if (error) return <div className="py-8 text-destructive text-center">Ошибка: {error.message}</div>
  if (!variant) return <div className="py-8 text-center">Вариант не найден</div>

  return (
    <div className="flex flex-col gap-6" style={{ maxWidth: '1200px', paddingLeft: '50px' }}>
      <div className="mb-6 flex items-center gap-2">
        <button
          type="button"
          className="bg-muted px-3 py-2 rounded flex items-center gap-2"
          onClick={() => router.push('/workflow-variants')}
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Назад</span>
        </button>
      </div>
      {/* Шапка: идентификатор и название */}
      <div className="flex items-center gap-3 text-3xl font-bold">
        <span>WFV #{variant.id}:</span>
        {editName ? (
          <>
            <input
              ref={nameInputRef}
              type="text"
              className="border rounded px-2 py-1 text-2xl font-bold w-auto"
              value={nameValue}
              onChange={e => setNameValue(e.target.value)}
              onBlur={handleUpdateName}
              onKeyDown={e => {
                if (e.key === 'Enter') handleUpdateName()
                if (e.key === 'Escape') {
                  setEditName(false)
                  setNameValue(variant.name)
                }
              }}
              maxLength={128}
            />
            <button
              className="ml-2 bg-primary text-white px-3 py-1 rounded text-sm"
              onMouseDown={e => { e.preventDefault(); handleUpdateName() }}
              type="button"
            >Сохранить</button>
            <button
              className="ml-1 bg-muted px-3 py-1 rounded text-sm"
              onMouseDown={e => { e.preventDefault(); setEditName(false); setNameValue(variant.name) }}
              type="button"
            >Отмена</button>
          </>
        ) : (
          <span
            className="cursor-pointer hover:underline"
            title="Редактировать название"
            onClick={() => setEditName(true)}
          >{variant.name}</span>
        )}
      </div>
      {/* Описание */}
      <div className="mb-2 text-lg">
        {editDescription ? (
          <>
            <input
              ref={descInputRef}
              type="text"
              className="border rounded px-2 py-1 w-full text-lg"
              value={descriptionValue}
              onChange={e => setDescriptionValue(e.target.value)}
              onBlur={handleUpdateDescription}
              onKeyDown={e => {
                if (e.key === 'Enter') handleUpdateDescription()
                if (e.key === 'Escape') {
                  setEditDescription(false)
                  setDescriptionValue(variant.description ?? '')
                }
              }}
              maxLength={512}
            />
            <button
              className="ml-2 bg-primary text-white px-3 py-1 rounded text-sm"
              onMouseDown={e => { e.preventDefault(); handleUpdateDescription() }}
              type="button"
            >Сохранить</button>
            <button
              className="ml-1 bg-muted px-3 py-1 rounded text-sm"
              onMouseDown={e => { e.preventDefault(); setEditDescription(false); setDescriptionValue(variant.description ?? '') }}
              type="button"
            >Отмена</button>
          </>
        ) : (
          <span
            className="cursor-pointer hover:underline text-muted-foreground"
            title="Редактировать описание"
            onClick={() => setEditDescription(true)}
          >{variant.description || <span className="italic">Нет описания</span>}</span>
        )}
      </div>
      {/* Теги варианта */}
      <div className="mb-6">
        <div className="font-semibold mb-2">Теги:</div>
        {tagsLoading ? (
          <div className="text-muted-foreground">Загрузка...</div>
        ) : (
          <div className="flex flex-wrap gap-2 mb-2">
            {tags && tags.length > 0 ? tags.map((tag, idx) => (
              <span key={tag.id + '-' + tag.tag + '-' + idx} className="inline-flex items-center bg-accent px-2 py-1 rounded text-sm">
                {tag.tag}
                <button
                  className="ml-2 text-destructive hover:text-red-700"
                  title="Удалить тег"
                  onClick={() => deleteTag.mutate({ workflowVariantId: id!, tag: tag.tag })}
                  type="button"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </span>
            )) : <span className="text-muted-foreground">Нет тегов</span>}
          </div>
        )}
        <form
          className="flex gap-2 items-center relative"
          onSubmit={e => {
            e.preventDefault()
            if (!newTag.trim()) return
            addTag.mutate({ workflowVariantId: id!, tag: newTag.trim() })
            setNewTag('')
            setShowSuggestions(false)
            setHighlightedIndex(-1)
          }}
          autoComplete="off"
        >
          <input
            ref={inputRef}
            type="text"
            className="border rounded px-2 py-1 text-sm"
            placeholder="Добавить тег..."
            value={newTag}
            onChange={e => setNewTag(e.target.value)}
            onFocus={() => setShowSuggestions(suggestions.length > 0)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 100)}
            onKeyDown={handleInputKeyDown}
            autoComplete="off"
          />
          <button type="submit" className="bg-primary text-white px-3 py-1 rounded text-sm">Добавить</button>
          {showSuggestions && suggestions.length > 0 && (
            <ul className="absolute z-10 bg-white border rounded shadow w-full mt-1 max-h-48 overflow-auto text-sm" style={{ left: 0, top: '100%' }}>
              {suggestions.map((s, idx) => (
                <li
                  key={s}
                  className={`px-2 py-1 cursor-pointer ${idx === highlightedIndex ? 'bg-muted' : ''}`}
                  onMouseDown={e => { e.preventDefault(); handleSuggestionClick(s) }}
                  onMouseEnter={() => setHighlightedIndex(idx)}
                >{s}</li>
              ))}
            </ul>
          )}
        </form>
      </div>
      <div className="mb-6">
        <div className="mb-2 text-muted-foreground">Template ID: {variant.workflowTemplateId}</div>
        <div className="mb-2 text-muted-foreground">Создан: {variant.createdAt ? new Date(variant.createdAt).toLocaleString() : "-"}</div>
        <div className="mb-2 text-muted-foreground">Обновлён: {variant.updatedAt ? new Date(variant.updatedAt).toLocaleString() : "-"}</div>
      </div>
      {/* Таблица параметров варианта */}
      <div className="mb-8">
        <div className="font-semibold mb-2">Параметры:</div>
        {paramsLoading ? (
          <div className="text-muted-foreground">Загрузка...</div>
        ) : (
          workflowParams && workflowParams.length > 0 ? (
            <table className="w-full border rounded">
              <thead>
                <tr className="bg-muted">
                  <th className="p-2 text-left">ID</th>
                  <th className="p-2 text-left">Имя</th>
                  <th className="p-2 text-left">Метка</th>
                  <th className="p-2 text-left">Значение</th>
                  <th className="p-2 text-left">Пользовательский</th>
                  <th className="p-2 text-left">Enum</th>
                  <th className="p-2 text-left">Позиция</th>
                </tr>
              </thead>
              <tbody>
                {workflowParams.map(param => (
                  <tr key={param.id} className="border-t">
                    <td className="p-2">{param.id}</td>
                    <td className="p-2">{param.paramName}</td>
                    <td className="p-2">{param.label}</td>
                    <td className="p-2">{String(param.value)}</td>
                    <td className="p-2">{param.user ? 'Да' : 'Нет'}</td>
                    <td className="p-2">{param.enum ? JSON.stringify(param.enum) : '-'}</td>
                    <td className="p-2">[{param.positionX}, {param.positionY}]</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <span className="text-muted-foreground">Нет параметров</span>
        )}
      </div>
      <div className="flex gap-2">
        <button className="bg-destructive text-white px-4 py-2 rounded" onClick={handleDelete}>Удалить</button>
      </div>
    </div>
  )
}
