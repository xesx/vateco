"use client"

import { useRouter, useParams } from "next/navigation"
import { useModel } from "@/hooks/use-model"
import { useUpdateModel, useDeleteModel } from "@/hooks/use-models"
import { useModelTags, useSetModelTags } from "@/hooks/use-model-tags"
import { useAllTags } from "@/hooks/use-all-tags"
import { useState, useMemo, useRef } from "react"
import React from "react"
import { ArrowLeft, Trash2 } from "lucide-react"

export default function ModelPage() {
  const router = useRouter()
  const params = useParams()
  const id = params?.id ? Number(params.id) : null

  const { data: model, isLoading, error } = useModel(id)
  const updateModel = useUpdateModel()
  const deleteModel = useDeleteModel()
  const { data: tags, isLoading: tagsLoading } = useModelTags(id)
  const setModelTags = useSetModelTags()
  const { data: allTags } = useAllTags()

  // Inline edit states
  const [editField, setEditField] = useState<string | null>(null)
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({})

  const currentFieldValues: Record<string, string> = {
    name: fieldValues.name !== undefined ? fieldValues.name : (model?.name ?? ""),
    label: fieldValues.label !== undefined ? fieldValues.label : (model?.label ?? ""),
    comfyUiDirectory: fieldValues.comfyUiDirectory !== undefined ? fieldValues.comfyUiDirectory : (model?.comfyUiDirectory ?? ""),
    comfyUiFileName: fieldValues.comfyUiFileName !== undefined ? fieldValues.comfyUiFileName : (model?.comfyUiFileName ?? ""),
    baseModel: fieldValues.baseModel !== undefined ? fieldValues.baseModel : (model?.baseModel ?? ""),
    description: fieldValues.description !== undefined ? fieldValues.description : (model?.description ?? ""),
  }

  // Tag input
  const [newTag, setNewTag] = useState("")
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const tagInputRef = useRef<HTMLInputElement>(null)

  const suggestions = useMemo(() => {
    if (!allTags) return []
    const currentTags = tags ?? []
    if (!newTag.trim()) {
      return allTags.filter(t => !currentTags.includes(t))
    }
    return allTags.filter(
      t => t.toLowerCase().includes(newTag.trim().toLowerCase()) && !currentTags.includes(t)
    )
  }, [newTag, allTags, tags])

  const setFieldValue = (field: string, value: string) => {
    setFieldValues(prev => ({
      ...currentFieldValues,
      ...prev,
      [field]: value,
    }))
  }

  const getFieldValue = (field: string): string => {
    if (fieldValues[field] !== undefined) return fieldValues[field]
    if (!model) return ""
    return (model as unknown as Record<string, string>)[field] ?? ""
  }

  const handleSave = async (field: string) => {
    if (!id || !model) return
    const value = getFieldValue(field)
    await updateModel.mutateAsync({
      id,
      [field]: value || undefined,
    })
    setEditField(null)
  }

  const handleCancel = (field: string) => {
    if (!model) return
    setFieldValues(prev => {
      const next = { ...prev }
      delete next[field]
      return next
    })
    setEditField(null)
  }

  const handleDelete = async () => {
    if (!id) return
    if (!window.confirm(`Удалить модель «${model?.label}»?`)) return
    await deleteModel.mutateAsync(id)
    router.push("/models")
  }

  const handleAddTag = async (tag: string) => {
    if (!id || !tag.trim()) return
    const currentTags = tags ?? []
    if (currentTags.includes(tag.trim())) return
    await setModelTags.mutateAsync({ modelId: id, tags: [...currentTags, tag.trim()] })
    setNewTag("")
    setShowSuggestions(false)
  }

  const handleRemoveTag = async (tagToRemove: string) => {
    if (!id) return
    const currentTags = tags ?? []
    await setModelTags.mutateAsync({ modelId: id, tags: currentTags.filter(t => t !== tagToRemove) })
  }

  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) {
      if (e.key === "Enter") {
        e.preventDefault()
        handleAddTag(newTag)
      }
      return
    }
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setHighlightedIndex(idx => (idx + 1) % suggestions.length)
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setHighlightedIndex(idx => (idx - 1 + suggestions.length) % suggestions.length)
    } else if (e.key === "Enter" && highlightedIndex >= 0) {
      e.preventDefault()
      setNewTag(suggestions[highlightedIndex])
      setShowSuggestions(false)
      setHighlightedIndex(-1)
    } else if (e.key === "Enter") {
      e.preventDefault()
      handleAddTag(newTag)
    } else if (e.key === "Escape") {
      setShowSuggestions(false)
      setHighlightedIndex(-1)
    }
  }

  const COMFY_DIRECTORIES = ["checkpoints", "loras", "controlnet", "clip", "vae", "upscale_models", "ipadapter", "embeddings"]

  if (isLoading) return <div className="py-8 text-center">Загрузка...</div>
  if (error) return <div className="py-8 text-destructive text-center">Ошибка: {error.message}</div>
  if (!model) return <div className="py-8 text-center">Модель не найдена</div>

  const renderEditableField = (field: string, label: string, multiline = false, isSelect = false, options?: string[]): React.JSX.Element => {
    const value = getFieldValue(field)
    const isEditing = editField === field

    return (
      <div className="flex items-start gap-2 py-2 border-b last:border-b-0">
        <span className="text-muted-foreground w-40 shrink-0 text-sm pt-1">{label}:</span>
        {isEditing ? (
          <div className="flex items-center gap-2 flex-1 flex-wrap">
            {isSelect && options ? (
              <select
                className="border rounded px-2 py-1 text-sm"
                value={value}
                onChange={e => setFieldValue(field, e.target.value)}
                autoFocus
              >
                <option value="">—</option>
                {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            ) : multiline ? (
              <textarea
                className="border rounded px-2 py-1 text-sm flex-1 min-w-[200px]"
                value={value}
                onChange={e => setFieldValue(field, e.target.value)}
                rows={3}
                autoFocus
              />
            ) : (
              <input
                type="text"
                className="border rounded px-2 py-1 text-sm flex-1 min-w-[200px]"
                value={value}
                onChange={e => setFieldValue(field, e.target.value)}
                autoFocus
                onKeyDown={e => {
                  if (e.key === "Enter") handleSave(field)
                  if (e.key === "Escape") handleCancel(field)
                }}
              />
            )}
            <button
              className="bg-primary text-white px-3 py-1 rounded text-sm"
              onClick={() => handleSave(field)}
              type="button"
            >Сохранить</button>
            <button
              className="bg-muted px-3 py-1 rounded text-sm"
              onClick={() => handleCancel(field)}
              type="button"
            >Отмена</button>
          </div>
        ) : (
          <span
            className="cursor-pointer hover:underline text-sm flex-1"
            title="Нажмите для редактирования"
            onClick={() => setEditField(field)}
          >
            {value ? value : <span className="italic text-muted-foreground">Не задано</span>}
          </span>
        )}
      </div>
    )
  }

  const labelValue = getFieldValue("label")

  return (
    <div className="flex flex-col gap-6 w-full" style={{ maxWidth: "1000px", paddingLeft: "24px" }}>
      {/* Назад */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="bg-muted px-3 py-2 rounded flex items-center gap-2"
          onClick={() => router.push("/models")}
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Назад</span>
        </button>
      </div>

      {/* Заголовок */}
      <div className="flex items-center gap-3 text-3xl font-bold">
        <span>Model #{model.id}:</span>
        {editField === "label" ? (
          <>
            <input
              type="text"
              className="border rounded px-2 py-1 text-2xl font-bold"
              value={labelValue}
              onChange={e => setFieldValue("label", e.target.value)}
              onBlur={() => handleSave("label")}
              onKeyDown={e => {
                if (e.key === "Enter") handleSave("label")
                if (e.key === "Escape") handleCancel("label")
              }}
              autoFocus
            />
            <button className="bg-primary text-white px-3 py-1 rounded text-sm" onClick={() => handleSave("label")} type="button">Сохранить</button>
            <button className="bg-muted px-3 py-1 rounded text-sm" onClick={() => handleCancel("label")} type="button">Отмена</button>
          </>
        ) : (
          <span
            className="cursor-pointer hover:underline"
            title="Редактировать метку"
            onClick={() => setEditField("label")}
          >{model.label}</span>
        )}
      </div>

      {/* Поля модели */}
      <div className="border rounded p-4 bg-card">
        <div className="font-semibold mb-3">Основные данные</div>
        {renderEditableField("name", "Name (системное)")}
        {renderEditableField("comfyUiDirectory", "Директория", false, true, COMFY_DIRECTORIES)}
        {renderEditableField("comfyUiFileName", "Имя файла")}
        {renderEditableField("baseModel", "Base Model")}
        {renderEditableField("description", "Описание", true)}

        <div className="flex items-start gap-2 py-2">
          <span className="text-muted-foreground w-40 shrink-0 text-sm pt-1">Создан:</span>
          <span className="text-sm">{model.createdAt ? new Date(model.createdAt).toLocaleString("ru-RU") : "—"}</span>
        </div>
        <div className="flex items-start gap-2 py-2">
          <span className="text-muted-foreground w-40 shrink-0 text-sm pt-1">Обновлён:</span>
          <span className="text-sm">{model.updatedAt ? new Date(model.updatedAt).toLocaleString("ru-RU") : "—"}</span>
        </div>
      </div>

      {/* Теги */}
      <div className="border rounded p-4 bg-card">
        <div className="font-semibold mb-3">Теги</div>
        {tagsLoading ? (
          <div className="text-muted-foreground text-sm">Загрузка...</div>
        ) : (
          <div className="flex flex-wrap gap-2 mb-3">
            {tags && tags.length > 0 ? tags.map((tag, idx) => (
              <span key={tag + "-" + idx} className="inline-flex items-center bg-accent px-2 py-1 rounded text-sm">
                {tag}
                <button
                  className="ml-2 text-destructive hover:text-red-700"
                  title="Удалить тег"
                  onClick={() => handleRemoveTag(tag)}
                  type="button"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </span>
            )) : <span className="text-muted-foreground text-sm">Нет тегов</span>}
          </div>
        )}

        <form
          className="flex gap-2 items-center relative"
          onSubmit={e => {
            e.preventDefault()
            handleAddTag(newTag)
          }}
          autoComplete="off"
        >
          <input
            ref={tagInputRef}
            type="text"
            className="border rounded px-2 py-1 text-sm"
            placeholder="Добавить тег..."
            value={newTag}
            onChange={e => setNewTag(e.target.value)}
            onFocus={() => setShowSuggestions(suggestions.length > 0)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 100)}
            onKeyDown={handleTagInputKeyDown}
            autoComplete="off"
          />
          <button type="submit" className="bg-primary text-white px-3 py-1 rounded text-sm">Добавить</button>
          {showSuggestions && suggestions.length > 0 && (
            <ul
              className="absolute z-10 bg-white border rounded shadow w-full mt-1 max-h-48 overflow-auto text-sm"
              style={{ left: 0, top: "100%" }}
            >
              {suggestions.map((s, idx) => (
                <li
                  key={s}
                  className={`px-2 py-1 cursor-pointer ${idx === highlightedIndex ? "bg-muted" : ""}`}
                  onMouseDown={e => {
                    e.preventDefault()
                    setNewTag(s)
                    setShowSuggestions(false)
                    setHighlightedIndex(-1)
                    setTimeout(() => tagInputRef.current?.focus(), 0)
                  }}
                  onMouseEnter={() => setHighlightedIndex(idx)}
                >{s}</li>
              ))}
            </ul>
          )}
        </form>
      </div>

      {/* Meta (JSON) */}
      {!!model.meta && Object.keys(model.meta as object).length > 0 && (
        <div className="border rounded p-4 bg-card">
          <div className="font-semibold mb-3">Meta (JSON)</div>
          <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-60">
            {JSON.stringify(model.meta, null, 2)}
          </pre>
        </div>
      )}

      <div className="flex gap-2 pb-8">
        <button
          className="bg-destructive text-white px-4 py-2 rounded"
          onClick={handleDelete}
          disabled={deleteModel.isPending}
          type="button"
        >
          {deleteModel.isPending ? "Удаление..." : "Удалить модель"}
        </button>
      </div>
    </div>
  )
}
