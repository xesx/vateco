'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import Link from 'next/link'

interface Workflow {
  id: string
  name: string
  description: string
  status: 'active' | 'inactive'
}

export default function WorkflowsPage() {
  const { data: workflows, isLoading } = useQuery({
    queryKey: ['workflows'],
    queryFn: async () => {
      const { data } = await api.get<Workflow[]>('/workflows')
      return data
    },
  })

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Workflows</h1>
          <p className="text-muted-foreground mt-2">
            Управление вашими рабочими процессами
          </p>
        </div>
        <Button>
          Создать Workflow
        </Button>
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

      {workflows && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {workflows.map((workflow) => (
            <Card key={workflow.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle>{workflow.name}</CardTitle>
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      workflow.status === 'active'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                    }`}
                  >
                    {workflow.status}
                  </span>
                </div>
                <CardDescription>{workflow.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    Редактировать
                  </Button>
                  <Button variant="default" size="sm" className="flex-1">
                    Запустить
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {workflows && workflows.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <p className="text-muted-foreground mb-4">
              У вас пока нет workflows
            </p>
            <Button>Создать первый Workflow</Button>
          </CardContent>
        </Card>
      )}

      <div className="mt-8">
        <Link href="/">
          <Button variant="ghost">← Назад на главную</Button>
        </Link>
      </div>
    </div>
  )
}

