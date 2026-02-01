'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

interface DashboardStats {
  totalUsers: number
  totalWorkflows: number
  activeInstances: number
}

export function DashboardCard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const { data } = await api.get<DashboardStats>('/stats')
      return data
    },
  })

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Статистика</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-muted rounded" />
            <div className="h-4 bg-muted rounded" />
            <div className="h-4 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Статистика</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Пользователи</span>
            <span className="text-2xl font-bold">{stats?.totalUsers ?? 0}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Workflow</span>
            <span className="text-2xl font-bold">{stats?.totalWorkflows ?? 0}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Активные инстансы</span>
            <span className="text-2xl font-bold">{stats?.activeInstances ?? 0}</span>
          </div>
          <Button className="w-full mt-4">Обновить</Button>
        </div>
      </CardContent>
    </Card>
  )
}

