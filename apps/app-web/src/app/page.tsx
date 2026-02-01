'use client'

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useUsers, useCreateUser } from "@/hooks/use-users"
import { useState } from "react"
import Link from "next/link"

export default function Home() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')

  const { data: users, isLoading, error } = useUsers()
  const createUser = useCreateUser()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name || !email) return

    try {
      await createUser.mutateAsync({ name, email })
      setName('')
      setEmail('')
    } catch (error) {
      console.error('Error creating user:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-zinc-100 dark:from-zinc-950 dark:to-zinc-900">
      <div className="container mx-auto py-10 px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight mb-2">
            Добро пожаловать в Vateco App
          </h1>
          <p className="text-muted-foreground">
            Пример приложения на Next.js + shadcn/ui + React Query
          </p>
        </div>

        {/* Навигационные карточки */}
        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle>Workflows</CardTitle>
              <CardDescription>
                Управление рабочими процессами
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/workflows">
                <Button className="w-full">Перейти →</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle>Пользователи</CardTitle>
              <CardDescription>
                Управление пользователями
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/users">
                <Button className="w-full">Перейти →</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle>Статистика</CardTitle>
              <CardDescription>
                Общая информация
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline" disabled>
                Скоро
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Создать пользователя</CardTitle>
              <CardDescription>
                Добавьте нового пользователя в систему
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Имя</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Введите имя"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="user@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={createUser.isPending}
                >
                  {createUser.isPending ? 'Создание...' : 'Создать'}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Список пользователей</CardTitle>
              <CardDescription>
                Все пользователи в системе
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading && (
                <div className="text-center py-4">Загрузка...</div>
              )}

              {error && (
                <div className="text-destructive py-4">
                  Ошибка: {error.message}
                </div>
              )}

              {users && users.length === 0 && (
                <div className="text-muted-foreground text-center py-4">
                  Пока нет пользователей
                </div>
              )}

              {users && users.length > 0 && (
                <div className="space-y-2">
                  {users.map((user) => (
                    <div
                      key={user.id}
                      className="p-3 border rounded-lg hover:bg-accent transition-colors"
                    >
                      <div className="font-medium">{user.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {user.email}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Технологии</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <h3 className="font-semibold mb-2">Next.js 15</h3>
                <p className="text-sm text-muted-foreground">
                  React фреймворк с поддержкой SSR и App Router
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">shadcn/ui</h3>
                <p className="text-sm text-muted-foreground">
                  Красивые компоненты на основе Radix UI и Tailwind
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">React Query</h3>
                <p className="text-sm text-muted-foreground">
                  Мощный инструмент для работы с серверным состоянием
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

