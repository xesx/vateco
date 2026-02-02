'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  useWorkflowTemplate,
  useUpdateWorkflowTemplateSchema,
} from '@/hooks/use-workflow-templates'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Save, RefreshCw } from 'lucide-react'
import { useParams } from 'next/navigation'

export default function WorkflowTemplatePage() {
  const params = useParams()
  const id = params?.id ? parseInt(params.id as string) : null

  const { data: template, isLoading, error } = useWorkflowTemplate(id)
  const updateSchema = useUpdateWorkflowTemplateSchema()

  const [schemaText, setSchemaText] = useState('')
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    if (template) {
      setSchemaText(JSON.stringify(template.schema, null, 2))
    }
  }, [template])

  const handleSchemaChange = (value: string) => {
    setSchemaText(value)
    setHasChanges(true)
  }

  const handleSave = async () => {
    if (!id) return

    let schema = {}
    try {
      schema = JSON.parse(schemaText)
    } catch {
      alert('Неверный формат JSON схемы')
      return
    }

    try {
      await updateSchema.mutateAsync({ id, schema })
      setHasChanges(false)
      alert('Схема успешно обновлена')
    } catch (error) {
      console.error('Error updating schema:', error)
      alert('Ошибка при обновлении схемы')
    }
  }

  const handleReset = () => {
    if (template) {
      setSchemaText(JSON.stringify(template.schema, null, 2))
      setHasChanges(false)
    }
  }

  const formatJson = () => {
    try {
      const parsed = JSON.parse(schemaText)
      setSchemaText(JSON.stringify(parsed, null, 2))
    } catch {
      alert('Неверный формат JSON')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-zinc-100 dark:from-zinc-950 dark:to-zinc-900">
        <div className="container mx-auto py-10 px-4">
          <Card>
            <CardHeader>
              <div className="h-8 bg-muted rounded animate-pulse mb-2" />
              <div className="h-4 bg-muted rounded animate-pulse w-2/3" />
            </CardHeader>
            <CardContent>
              <div className="h-96 bg-muted rounded animate-pulse" />
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-zinc-100 dark:from-zinc-950 dark:to-zinc-900">
        <div className="container mx-auto py-10 px-4">
          <Card className="border-destructive">
            <CardContent className="pt-6">
              <p className="text-destructive mb-4">
                Ошибка загрузки template: {error.message}
              </p>
              <Link href="/workflow-templates">
                <Button variant="outline">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Назад к списку
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!template) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-zinc-100 dark:from-zinc-950 dark:to-zinc-900">
        <div className="container mx-auto py-10 px-4">
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground mb-4">Template не найден</p>
              <Link href="/workflow-templates">
                <Button variant="outline">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Назад к списку
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-zinc-100 dark:from-zinc-950 dark:to-zinc-900">
      <div className="container mx-auto py-10 px-4 max-w-6xl">
        <div className="mb-6">
          <Link href="/workflow-templates">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Назад к списку
            </Button>
          </Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Информация о template */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Информация</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-xs text-muted-foreground">ID</Label>
                <p className="text-sm font-mono">#{template.id}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Название</Label>
                <p className="text-sm font-medium">{template.name}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Описание</Label>
                <p className="text-sm">{template.description || 'Нет описания'}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Создан</Label>
                <p className="text-sm">
                  {new Date(template.createdAt).toLocaleString('ru-RU')}
                </p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Обновлён</Label>
                <p className="text-sm">
                  {new Date(template.updatedAt).toLocaleString('ru-RU')}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Редактор схемы */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>Schema (JSON)</CardTitle>
                  <CardDescription>
                    Редактируйте JSON схему workflow template
                  </CardDescription>
                </div>
                {hasChanges && (
                  <span className="text-xs text-orange-600 dark:text-orange-400">
                    • Есть несохранённые изменения
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Textarea
                  value={schemaText}
                  onChange={(e) => handleSchemaChange(e.target.value)}
                  rows={20}
                  className="font-mono text-sm"
                  placeholder='{"key": "value"}'
                />
                <div className="flex gap-2">
                  <Button
                    onClick={handleSave}
                    disabled={!hasChanges || updateSchema.isPending}
                    className="flex-1"
                  >
                    <Save className="mr-2 h-4 w-4" />
                    {updateSchema.isPending ? 'Сохранение...' : 'Сохранить схему'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleReset}
                    disabled={!hasChanges}
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Сбросить
                  </Button>
                  <Button
                    variant="outline"
                    onClick={formatJson}
                  >
                    Форматировать JSON
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Просмотр схемы в виде дерева */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Предварительный просмотр схемы</CardTitle>
            <CardDescription>
              Структура JSON схемы в читаемом виде
            </CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded-lg overflow-auto max-h-96 text-xs">
              {schemaText}
            </pre>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
