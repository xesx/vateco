'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useUsers, useCreateUser, useDeleteUser } from '@/hooks/use-users'
import { useState } from 'react'
import Link from 'next/link'

export default function UsersPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')

  const { data: users, isLoading } = useUsers()
  const createUser = useCreateUser()
  const deleteUser = useDeleteUser()

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

  const handleDelete = async (id: string) => {
    if (!confirm('Вы уверены, что хотите удалить этого пользователя?')) return

    try {
      await deleteUser.mutateAsync(id)
    } catch (error) {
      console.error('Error deleting user:', error)
    }
  }

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="mb-8">
        <h1 className="text-4xl font-bold tracking-tight">Пользователи</h1>
        <p className="text-muted-foreground mt-2">
          Управление пользователями системы
        </p>
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
            <CardDescription>Всего: {users?.length ?? 0}</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading && (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="p-3 border rounded-lg animate-pulse"
                  >
                    <div className="h-5 bg-muted rounded mb-2" />
                    <div className="h-4 bg-muted rounded w-2/3" />
                  </div>
                ))}
              </div>
            )}

            {users && users.length === 0 && (
              <div className="text-muted-foreground text-center py-4">
                Пока нет пользователей
              </div>
            )}

            {users && users.length > 0 && (
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {users.map((user) => (
                  <div
                    key={user.id}
                    className="p-3 border rounded-lg hover:bg-accent transition-colors flex justify-between items-center"
                  >
                    <div>
                      <div className="font-medium">{user.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {user.email}
                      </div>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(user.id)}
                      disabled={deleteUser.isPending}
                    >
                      Удалить
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <Link href="/">
          <Button variant="ghost">← Назад на главную</Button>
        </Link>
      </div>
    </div>
  )
}

