"use client"

import React, { useState } from "react"
import { useModels, useCreateModel, useCreateModelFromCivitai, useCreateModelFromHuggingface } from "@/hooks/use-models"
import type { Model } from "@/hooks/use-models"
import { Edit, Plus } from "lucide-react"

const COMFY_DIRECTORIES = [
  "checkpoints",
  "loras",
  "controlnet",
  "clip",
  "vae",
  "upscale_models",
  "ipadapter",
  "embeddings",
]

export default function ModelsPage() {
  const [directory, setDirectory] = useState("")
  const { data: models, isLoading, error } = useModels(directory)
  const createModel = useCreateModel()
  const createFromCivitai = useCreateModelFromCivitai()
  const createFromHuggingface = useCreateModelFromHuggingface()

  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showCivitaiForm, setShowCivitaiForm] = useState(false)
  const [showHuggingfaceForm, setShowHuggingfaceForm] = useState(false)

  const [form, setForm] = useState({
    name: "",
    label: "",
    comfyUiDirectory: "",
    comfyUiFileName: "",
    baseModel: "",
  })

  const [civitaiForm, setCivitaiForm] = useState({
    url: "",
    comfyUiDirectory: "",
    label: "",
    baseModel: "",
  })

  const [hfForm, setHfForm] = useState({
    url: "",
    comfyUiDirectory: "",
    label: "",
    baseModel: "",
  })

  const [createError, setCreateError] = useState<string | null>(null)

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreateError(null)
    if (!form.name || !form.label || !form.comfyUiDirectory || !form.comfyUiFileName) return
    try {
      await createModel.mutateAsync({
        name: form.name,
        label: form.label,
        comfyUiDirectory: form.comfyUiDirectory,
        comfyUiFileName: form.comfyUiFileName,
        baseModel: form.baseModel || undefined,
      })
      setForm({ name: "", label: "", comfyUiDirectory: "", comfyUiFileName: "", baseModel: "" })
      setShowCreateForm(false)
    } catch (err: unknown) {
      setCreateError(err instanceof Error ? err.message : String(err))
    }
  }

  const handleCreateFromCivitai = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreateError(null)
    if (!civitaiForm.url || !civitaiForm.comfyUiDirectory) return
    try {
      await createFromCivitai.mutateAsync({
        url: civitaiForm.url,
        comfyUiDirectory: civitaiForm.comfyUiDirectory,
        label: civitaiForm.label || undefined,
        baseModel: civitaiForm.baseModel || undefined,
      })
      setCivitaiForm({ url: "", comfyUiDirectory: "", label: "", baseModel: "" })
      setShowCivitaiForm(false)
    } catch (err: unknown) {
      setCreateError(err instanceof Error ? err.message : String(err))
    }
  }

  const handleCreateFromHuggingface = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreateError(null)
    if (!hfForm.url || !hfForm.comfyUiDirectory) return
    try {
      await createFromHuggingface.mutateAsync({
        url: hfForm.url,
        comfyUiDirectory: hfForm.comfyUiDirectory,
        label: hfForm.label || undefined,
        baseModel: hfForm.baseModel || undefined,
      })
      setHfForm({ url: "", comfyUiDirectory: "", label: "", baseModel: "" })
      setShowHuggingfaceForm(false)
    } catch (err: unknown) {
      setCreateError(err instanceof Error ? err.message : String(err))
    }
  }

  return (
    <div className="flex flex-col gap-6" style={{ maxWidth: "1400px", paddingLeft: "24px" }}>
      <h1 className="text-3xl font-bold">Модели</h1>
      <p className="text-muted-foreground">Управление моделями ComfyUI</p>

      {/* Фильтр по директории */}
      <div className="flex gap-2 items-center flex-wrap">
        <label className="text-sm font-medium">Фильтр по директории:</label>
        <select
          className="border rounded px-2 py-1 text-sm"
          value={directory}
          onChange={e => setDirectory(e.target.value)}
        >
          <option value="">Все</option>
          {COMFY_DIRECTORIES.map(dir => (
            <option key={dir} value={dir}>{dir}</option>
          ))}
        </select>
      </div>

      {/* Кнопки создания */}
      <div className="flex gap-2 flex-wrap">
        <button
          className="bg-primary text-white px-4 py-2 rounded flex items-center gap-2 text-sm"
          onClick={() => { setShowCreateForm(v => !v); setShowCivitaiForm(false); setShowHuggingfaceForm(false); setCreateError(null) }}
        >
          <Plus className="h-4 w-4" /> Создать вручную
        </button>
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2 text-sm"
          onClick={() => { setShowCivitaiForm(v => !v); setShowCreateForm(false); setShowHuggingfaceForm(false); setCreateError(null) }}
        >
          <Plus className="h-4 w-4" /> Из Civitai
        </button>
        <button
          className="bg-orange-600 text-white px-4 py-2 rounded flex items-center gap-2 text-sm"
          onClick={() => { setShowHuggingfaceForm(v => !v); setShowCreateForm(false); setShowCivitaiForm(false); setCreateError(null) }}
        >
          <Plus className="h-4 w-4" /> Из HuggingFace
        </button>
      </div>

      {createError && (
        <div className="text-destructive border border-destructive rounded px-4 py-2 text-sm">{createError}</div>
      )}

      {/* Форма создания вручную */}
      {showCreateForm && (
        <form onSubmit={handleCreate} className="flex gap-2 items-end flex-wrap border rounded p-4 bg-muted/30">
          <div>
            <label className="block text-sm mb-1">Название (name)</label>
            <input type="text" className="border rounded px-2 py-1 text-sm" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required placeholder="sd_xl_base_1_0" />
          </div>
          <div>
            <label className="block text-sm mb-1">Метка (label)</label>
            <input type="text" className="border rounded px-2 py-1 text-sm" value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))} required placeholder="SDXL Base 1.0" />
          </div>
          <div>
            <label className="block text-sm mb-1">Директория</label>
            <select className="border rounded px-2 py-1 text-sm" value={form.comfyUiDirectory} onChange={e => setForm(f => ({ ...f, comfyUiDirectory: e.target.value }))} required>
              <option value="">Выберите...</option>
              {COMFY_DIRECTORIES.map(dir => <option key={dir} value={dir}>{dir}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1">Имя файла</label>
            <input type="text" className="border rounded px-2 py-1 text-sm" value={form.comfyUiFileName} onChange={e => setForm(f => ({ ...f, comfyUiFileName: e.target.value }))} required placeholder="sd_xl_base_1_0.safetensors" />
          </div>
          <div>
            <label className="block text-sm mb-1">Base model</label>
            <input type="text" className="border rounded px-2 py-1 text-sm" value={form.baseModel} onChange={e => setForm(f => ({ ...f, baseModel: e.target.value }))} placeholder="SDXL" />
          </div>
          <button type="submit" className="bg-primary text-white px-4 py-2 rounded text-sm" disabled={createModel.isPending}>
            {createModel.isPending ? "Создание..." : "Создать"}
          </button>
          <button type="button" className="bg-muted px-4 py-2 rounded text-sm" onClick={() => setShowCreateForm(false)}>Отмена</button>
        </form>
      )}

      {/* Форма из Civitai */}
      {showCivitaiForm && (
        <form onSubmit={handleCreateFromCivitai} className="flex gap-2 items-end flex-wrap border rounded p-4 bg-blue-50">
          <div className="flex-1 min-w-[300px]">
            <label className="block text-sm mb-1">Ссылка Civitai</label>
            <input type="url" className="border rounded px-2 py-1 text-sm w-full" value={civitaiForm.url} onChange={e => setCivitaiForm(f => ({ ...f, url: e.target.value }))} required placeholder="https://civitai.com/models/123?modelVersionId=456" />
          </div>
          <div>
            <label className="block text-sm mb-1">Директория</label>
            <select className="border rounded px-2 py-1 text-sm" value={civitaiForm.comfyUiDirectory} onChange={e => setCivitaiForm(f => ({ ...f, comfyUiDirectory: e.target.value }))} required>
              <option value="">Выберите...</option>
              {COMFY_DIRECTORIES.map(dir => <option key={dir} value={dir}>{dir}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1">Метка (label)</label>
            <input type="text" className="border rounded px-2 py-1 text-sm" value={civitaiForm.label} onChange={e => setCivitaiForm(f => ({ ...f, label: e.target.value }))} placeholder="Опционально" />
          </div>
          <div>
            <label className="block text-sm mb-1">Base model</label>
            <input type="text" className="border rounded px-2 py-1 text-sm" value={civitaiForm.baseModel} onChange={e => setCivitaiForm(f => ({ ...f, baseModel: e.target.value }))} placeholder="Опционально" />
          </div>
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded text-sm" disabled={createFromCivitai.isPending}>
            {createFromCivitai.isPending ? "Загрузка..." : "Создать из Civitai"}
          </button>
          <button type="button" className="bg-muted px-4 py-2 rounded text-sm" onClick={() => setShowCivitaiForm(false)}>Отмена</button>
        </form>
      )}

      {/* Форма из HuggingFace */}
      {showHuggingfaceForm && (
        <form onSubmit={handleCreateFromHuggingface} className="flex gap-2 items-end flex-wrap border rounded p-4 bg-orange-50">
          <div className="flex-1 min-w-[300px]">
            <label className="block text-sm mb-1">Ссылка HuggingFace</label>
            <input type="url" className="border rounded px-2 py-1 text-sm w-full" value={hfForm.url} onChange={e => setHfForm(f => ({ ...f, url: e.target.value }))} required placeholder="https://huggingface.co/author/model/blob/main/file.safetensors" />
          </div>
          <div>
            <label className="block text-sm mb-1">Директория</label>
            <select className="border rounded px-2 py-1 text-sm" value={hfForm.comfyUiDirectory} onChange={e => setHfForm(f => ({ ...f, comfyUiDirectory: e.target.value }))} required>
              <option value="">Выберите...</option>
              {COMFY_DIRECTORIES.map(dir => <option key={dir} value={dir}>{dir}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1">Метка (label)</label>
            <input type="text" className="border rounded px-2 py-1 text-sm" value={hfForm.label} onChange={e => setHfForm(f => ({ ...f, label: e.target.value }))} placeholder="Опционально" />
          </div>
          <div>
            <label className="block text-sm mb-1">Base model</label>
            <input type="text" className="border rounded px-2 py-1 text-sm" value={hfForm.baseModel} onChange={e => setHfForm(f => ({ ...f, baseModel: e.target.value }))} placeholder="Опционально" />
          </div>
          <button type="submit" className="bg-orange-600 text-white px-4 py-2 rounded text-sm" disabled={createFromHuggingface.isPending}>
            {createFromHuggingface.isPending ? "Загрузка..." : "Создать из HuggingFace"}
          </button>
          <button type="button" className="bg-muted px-4 py-2 rounded text-sm" onClick={() => setShowHuggingfaceForm(false)}>Отмена</button>
        </form>
      )}

      {/* Таблица моделей */}
      <div>
        {isLoading && <div className="py-4">Загрузка...</div>}
        {error && <div className="text-destructive py-4">Ошибка: {error.message}</div>}
        {models && (
          <table className="w-full border rounded">
            <thead>
              <tr className="bg-muted">
                <th className="p-2 text-left">ID</th>
                <th className="p-2 text-left">Name</th>
                <th className="p-2 text-left">Label</th>
                <th className="p-2 text-left">Директория</th>
                <th className="p-2 text-left">Файл</th>
                <th className="p-2 text-left">Base Model</th>
                <th className="p-2 text-left">Действия</th>
              </tr>
            </thead>
            <tbody>
              {models.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-4 text-center text-muted-foreground">Нет моделей</td>
                </tr>
              )}
              {models.map((model: Model) => (
                <tr
                  key={model.id}
                  className="border-t hover:bg-accent cursor-pointer"
                  onClick={() => window.location.href = `/models/${model.id}`}
                >
                  <td className="p-2">{model.id}</td>
                  <td className="p-2 font-mono text-sm">{model.name}</td>
                  <td className="p-2">{model.label}</td>
                  <td className="p-2">
                    <span className="bg-muted px-1 py-0.5 rounded text-xs">{model.comfyUiDirectory}</span>
                  </td>
                  <td className="p-2 text-sm text-muted-foreground">{model.comfyUiFileName}</td>
                  <td className="p-2 text-sm">{model.baseModel ?? "—"}</td>
                  <td className="p-2 flex gap-2" onClick={e => e.stopPropagation()}>
                    <button
                      className="bg-muted px-2 py-1 rounded flex items-center justify-center"
                      title="Редактировать"
                      onClick={() => window.location.href = `/models/${model.id}`}
                    >
                      <Edit className="h-4 w-4" />
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

