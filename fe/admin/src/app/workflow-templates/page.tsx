'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  useWorkflowTemplates,
  useCreateWorkflowTemplate,
  useDeleteWorkflowTemplate,
  useUpdateWorkflowTemplate,
} from '@/hooks/use-workflow-templates'
import { useState } from 'react'
import Link from 'next/link'
import { Trash2, Edit, Eye, Plus } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

export default function WorkflowTemplatesPage() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [schemaText, setSchemaText] = useState('{}')

  const [editName, setEditName] = useState('')
  const [editDescription, setEditDescription] = useState('')

  const { data: templates, isLoading, error } = useWorkflowTemplates()
  const createTemplate = useCreateWorkflowTemplate()
  const updateTemplate = useUpdateWorkflowTemplate()
  const deleteTemplate = useDeleteWorkflowTemplate()

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()

    let schema = {}
    try {
      schema = JSON.parse(schemaText)
    } catch {
      alert('Неверный формат JSON схемы')
      return
    }

    try {
      await createTemplate.mutateAsync({ name, description, schema })
      setName('')
      setDescription('')
      setSchemaText('{}')
      setCreateDialogOpen(false)
    } catch (error) {
      console.error('Error creating template:', error)
      alert('Ошибка при создании template')
    }
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedTemplateId) return

    try {
      await updateTemplate.mutateAsync({
        id: selectedTemplateId,
        name: editName,
        description: editDescription,
      })
      setEditDialogOpen(false)
      setSelectedTemplateId(null)
    } catch (error) {
      console.error('Error updating template:', error)
      alert('Ошибка при обновлении template')
    }
  }

  const handleDelete = async () => {
    if (!selectedTemplateId) return

    try {
      await deleteTemplate.mutateAsync(selectedTemplateId)
      setDeleteDialogOpen(false)
      setSelectedTemplateId(null)
    } catch (error) {
      console.error('Error deleting template:', error)
      alert('Ошибка при удалении template')
    }
  }

  const openEditDialog = (template: any) => {
    setSelectedTemplateId(template.id)
    setEditName(template.name)
    setEditDescription(template.description || '')
    setEditDialogOpen(true)
  }

  const openDeleteDialog = (templateId: number) => {
    setSelectedTemplateId(templateId)
    setDeleteDialogOpen(true)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-zinc-100 dark:from-zinc-950 dark:to-zinc-900">
      <div className="container mx-auto py-10 px-4">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">Workflow Templates</h1>
            <p className="text-muted-foreground mt-2">
              Управление шаблонами рабочих процессов
            </p>
          </div>

          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Создать Template
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Создать Workflow Template</DialogTitle>
                <DialogDescription>
                  Создайте новый шаблон рабочего процесса
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreate}>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Название</Label>
                    <Input
                      id="name"
                      placeholder="template-name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Описание</Label>
                    <Textarea
                      id="description"
                      placeholder="Описание template"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="schema">Schema (JSON)</Label>
                    <Textarea
                      id="schema"
                      placeholder='{"key": "value"}'
                      value={schemaText}
                      onChange={(e) => setSchemaText(e.target.value)}
                      rows={10}
                      className="font-mono text-sm"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCreateDialogOpen(false)}
                  >
                    Отмена
                  </Button>
                  <Button type="submit" disabled={createTemplate.isPending}>
                    {createTemplate.isPending ? 'Создание...' : 'Создать'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <div className="h-6 bg-muted rounded animate-pulse mb-2" />
                  <div className="h-4 bg-muted rounded animate-pulse w-2/3" />
                </CardHeader>
              </Card>
            ))}
          </div>
        )}

        {error && (
          <Card className="border-destructive">
            <CardContent className="pt-6">
              <p className="text-destructive">
                Ошибка загрузки: {error.message}
              </p>
            </CardContent>
          </Card>
        )}

        {templates && templates.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-10">
              <p className="text-muted-foreground mb-4">
                У вас пока нет workflow templates
              </p>
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Создать первый Template
              </Button>
            </CardContent>
          </Card>
        )}

        {templates && templates.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {templates.map((template) => (
              <Card key={template.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-start justify-between">
                    <span className="break-all">{template.name}</span>
                    <span className="text-xs text-muted-foreground ml-2 shrink-0">
                      #{template.id}
                    </span>
                  </CardTitle>
                  <CardDescription className="min-h-[2.5rem]">
                    {template.description || 'Нет описания'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-xs text-muted-foreground mb-4">
                    <div>Создан: {new Date(template.createdAt).toLocaleDateString('ru-RU')}</div>
                    <div>Обновлён: {new Date(template.updatedAt).toLocaleDateString('ru-RU')}</div>
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/workflow-templates/${template.id}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">
                        <Eye className="mr-2 h-4 w-4" />
                        Просмотр
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(template)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => openDeleteDialog(template.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="mt-8">
          <Link href="/">
            <Button variant="ghost">← Назад на главную</Button>
          </Link>
        </div>

        {/* Edit Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Редактировать Template</DialogTitle>
              <DialogDescription>
                Измените название и описание template
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleEdit}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Название</Label>
                  <Input
                    id="edit-name"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-description">Описание</Label>
                  <Textarea
                    id="edit-description"
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditDialogOpen(false)}
                >
                  Отмена
                </Button>
                <Button type="submit" disabled={updateTemplate.isPending}>
                  {updateTemplate.isPending ? 'Сохранение...' : 'Сохранить'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Вы уверены?</AlertDialogTitle>
              <AlertDialogDescription>
                Это действие нельзя будет отменить. Template будет удалён навсегда.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Отмена</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleteTemplate.isPending ? 'Удаление...' : 'Удалить'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}
