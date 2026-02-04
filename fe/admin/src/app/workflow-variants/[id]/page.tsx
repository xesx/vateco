"use client"

import { useRouter, useParams } from "next/navigation"
import { useWorkflowVariant, useUpdateWorkflowVariant, useDeleteWorkflowVariant } from "@/hooks/use-workflow-variant"
import { useState, useEffect } from "react"
import { ArrowLeft } from 'lucide-react'
import { useWorkflowVariantTags, useAddWorkflowVariantTag, useDeleteWorkflowVariantTag } from '@/hooks/use-workflow-variant-tags'
import { Trash2 } from 'lucide-react'
import { useWorkflowVariantParams } from '@/hooks/use-workflow-variant-params'

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
  const [form, setForm] = useState({ name: "", description: "" })
  const [editMode, setEditMode] = useState(false)
  const [newTag, setNewTag] = useState('')

  // Заполнить форму при загрузке варианта
  useEffect(() => {
    if (variant) {
      setForm({ name: variant.name, description: variant.description ?? "" })
    }
  }, [variant])

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id) return
    await updateVariant.mutateAsync({ workflowVariantId: id, ...form })
    setEditMode(false)
  }

  const handleDelete = async () => {
    if (!id) return
    if (window.confirm("Удалить вариант?")) {
      await deleteVariant.mutateAsync(id)
      router.push("/workflow-variants")
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
      <h1 className="text-3xl font-bold">Вариант workflow #{variant.id}</h1>
      <p className="text-muted-foreground">Управление вариантом workflow</p>
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
          className="flex gap-2 items-center"
          onSubmit={e => {
            e.preventDefault()
            if (!newTag.trim()) return
            addTag.mutate({ workflowVariantId: id!, tag: newTag.trim() })
            setNewTag('')
          }}
        >
          <input
            type="text"
            className="border rounded px-2 py-1 text-sm"
            placeholder="Добавить тег..."
            value={newTag}
            onChange={e => setNewTag(e.target.value)}
          />
          <button type="submit" className="bg-primary text-white px-3 py-1 rounded text-sm">Добавить</button>
        </form>
      </div>
      <div className="mb-6">
        <div className="mb-2 text-muted-foreground">Template ID: {variant.workflowTemplateId}</div>
        <div className="mb-2 text-muted-foreground">Создан: {variant.createdAt ? new Date(variant.createdAt).toLocaleString() : "-"}</div>
        <div className="mb-2 text-muted-foreground">Обновлён: {variant.updatedAt ? new Date(variant.updatedAt).toLocaleString() : "-"}</div>
      </div>
      {editMode ? (
        <form onSubmit={handleUpdate} className="space-y-4 mb-6">
          <div>
            <label className="block text-sm mb-1">Название</label>
            <input type="text" className="border rounded px-2 py-1 w-full" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
          </div>
          <div>
            <label className="block text-sm mb-1">Описание</label>
            <input type="text" className="border rounded px-2 py-1 w-full" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>
          <div className="flex gap-2">
            <button type="submit" className="bg-primary text-white px-4 py-2 rounded">Сохранить</button>
            <button type="button" className="bg-muted px-4 py-2 rounded" onClick={() => setEditMode(false)}>Отмена</button>
          </div>
        </form>
      ) : (
        <div className="mb-6">
          <div className="mb-2"><span className="font-semibold">Название:</span> {variant.name}</div>
          <div className="mb-2"><span className="font-semibold">Описание:</span> {variant.description}</div>
        </div>
      )}
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
      {!editMode && (
        <div className="flex gap-2">
          <button className="bg-muted px-4 py-2 rounded" onClick={() => setEditMode(true)}>Редактировать</button>
          <button className="bg-destructive text-white px-4 py-2 rounded" onClick={handleDelete}>Удалить</button>
        </div>
      )}
    </div>
  )
}
