"use client"

import React, { useState } from "react"
import { useWorkflowVariants, useCreateWorkflowVariant, useUpdateWorkflowVariant, useDeleteWorkflowVariant } from "@/hooks/use-workflow-variants"
import type { WorkflowVariant } from '@/hooks/use-workflow-variants'
import { Trash2, Edit } from 'lucide-react'

export default function WorkflowVariantsPage() {
  const { data: variants, isLoading, error } = useWorkflowVariants()
  const createVariant = useCreateWorkflowVariant()
  const updateVariant = useUpdateWorkflowVariant()
  const deleteVariant = useDeleteWorkflowVariant()

  const [form, setForm] = useState({ name: "", description: "", workflowTemplateId: 1 })
  const [editId, setEditId] = useState<number | null>(null)
  const [editForm, setEditForm] = useState({ name: "", description: "" })

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name) return
    await createVariant.mutateAsync(form)
    setForm({ name: "", description: "", workflowTemplateId: 1 })
  }

  const handleEdit = (variant: WorkflowVariant) => {
    setEditId(variant.id)
    setEditForm({ name: variant.name, description: variant.description ?? "" })
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editId) return
    await updateVariant.mutateAsync({ workflowVariantId: editId, ...editForm })
    setEditId(null)
    setEditForm({ name: "", description: "" })
  }

  const handleDelete = async (id: number) => {
    if (window.confirm("Удалить вариант?")) {
      await deleteVariant.mutateAsync(id)
    }
  }

  return (
    <div className="flex flex-col gap-6" style={{ maxWidth: '1200px', paddingLeft: '24px' }}>
      <h1 className="text-3xl font-bold">Workflow Variants</h1>
      <p className="text-muted-foreground">Управление вариантами workflow</p>
      <form onSubmit={handleCreate} className="flex gap-2 items-end">
        <div>
          <label className="block text-sm mb-1">Название</label>
          <input type="text" className="border rounded px-2 py-1" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
        </div>
        <div>
          <label className="block text-sm mb-1">Описание</label>
          <input type="text" className="border rounded px-2 py-1" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
        </div>
        <div>
          <label className="block text-sm mb-1">Template ID</label>
          <input type="number" className="border rounded px-2 py-1 w-24" value={form.workflowTemplateId} onChange={e => setForm(f => ({ ...f, workflowTemplateId: Number(e.target.value) }))} required />
        </div>
        <button type="submit" className="bg-primary text-white px-4 py-2 rounded">Создать</button>
      </form>
      <div>
        {isLoading && <div className="py-4">Загрузка...</div>}
        {error && <div className="text-destructive py-4">Ошибка: {error.message}</div>}
        {variants && (
          <table className="w-full border rounded mb-8">
            <thead>
              <tr className="bg-muted">
                <th className="p-2 text-left">ID</th>
                <th className="p-2 text-left">Название</th>
                <th className="p-2 text-left">Описание</th>
                <th className="p-2 text-left">Template ID</th>
                <th className="p-2 text-left">Действия</th>
              </tr>
            </thead>
            <tbody>
              {variants.map((variant: WorkflowVariant) => (
                <tr key={variant.id} className="border-t hover:bg-accent">
                  <td className="p-2 cursor-pointer" onClick={() => window.location.href = `/workflow-variants/${variant.id}`}>{variant.id}</td>
                  <td className="p-2 cursor-pointer" onClick={() => window.location.href = `/workflow-variants/${variant.id}`}>{variant.name}</td>
                  <td className="p-2 cursor-pointer" onClick={() => window.location.href = `/workflow-variants/${variant.id}`}>{variant.description}</td>
                  <td className="p-2 cursor-pointer" onClick={() => window.location.href = `/workflow-variants/${variant.id}`}>{variant.workflowTemplateId}</td>
                  <td className="p-2 flex gap-2">
                    <button
                      className="bg-muted px-2 py-1 rounded flex items-center justify-center"
                      title="Редактировать"
                      onClick={e => {
                        e.stopPropagation();
                        window.location.href = `/workflow-variants/${variant.id}`
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      className="bg-destructive text-white px-2 py-1 rounded flex items-center justify-center"
                      title="Удалить"
                      onClick={e => {
                        e.stopPropagation();
                        handleDelete(variant.id)
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
