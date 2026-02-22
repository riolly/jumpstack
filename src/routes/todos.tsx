import { useForm } from '@tanstack/react-form'
import { useMutation, useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

import { SuspenseQueryBoundary } from '#/components/suspense-query-boundary'
import { Button } from '#/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '#/components/ui/card'
import { Input } from '#/components/ui/input'
import { orpc } from '#/orpc/client'

const listTodosOptions = orpc.todo.list.queryOptions()

export const Route = createFileRoute('/todos')({
  loader: async ({ context }) => {
    context.queryClient.ensureQueryData(listTodosOptions)
  },
  component: TodosComponent,
})

function TodosComponent() {
  const { mutate: addTodo } = useMutation({
    mutationFn: (input: { title: string }) => orpc.todo.add.call({ title: input.title }),
    onSuccess: (_data, _variables, _onMutateResult, context) => {
      context.client.invalidateQueries(listTodosOptions)
    },
  })

  const form = useForm({
    defaultValues: { title: '' },
    onSubmit: async ({ value }) => {
      addTodo({ title: value.title.trim() })
      form.reset()
    },
  })

  return (
    <div className="mx-auto max-w-2xl p-4">
      <Card>
        <CardHeader>
          <CardTitle>Todo List</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              e.stopPropagation()
              form.handleSubmit()
            }}
            className="flex gap-2"
          >
            <form.Field
              name="title"
              validators={{
                onChange: z.string().min(1, 'Required'),
              }}
            >
              {(field) => (
                <Input
                  placeholder="What needs to be done?"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  className="flex-1"
                />
              )}
            </form.Field>
            <form.Subscribe selector={(s) => [s.canSubmit, s.isSubmitting]}>
              {([canSubmit, isSubmitting]) => (
                <Button type="submit" disabled={!canSubmit || isSubmitting}>
                  {isSubmitting ? 'Adding…' : 'Add'}
                </Button>
              )}
            </form.Subscribe>
          </form>

          <SuspenseQueryBoundary
            fallback={
              <ul className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <li key={i} className="bg-card flex animate-pulse items-center gap-3 rounded-lg border p-3">
                    <span className="bg-muted/50 h-5 w-5 rounded border" />
                    <span className="bg-muted/50 h-5 flex-1 rounded" />
                    <span className="bg-muted/50 h-8 w-16 rounded" />
                  </li>
                ))}
              </ul>
            }
            errorMessage="Failed to load todos"
          >
            <TodoList />
          </SuspenseQueryBoundary>
        </CardContent>
      </Card>
    </div>
  )
}

function TodoList() {
  const { data: todos } = useSuspenseQuery(listTodosOptions)

  const { mutate: toggleComplete } = useMutation({
    mutationFn: (input: { id: number }) => orpc.todo.toggle.call(input),
    onSuccess: (_data, _variables, _onMutateResult, context) => {
      context.client.invalidateQueries(listTodosOptions)
    },
  })

  const { mutate: deleteTodo } = useMutation({
    mutationFn: (input: { id: number }) => orpc.todo.remove.call(input),
    onSuccess: (_data, _variables, _onMutateResult, context) => {
      context.client.invalidateQueries(listTodosOptions)
    },
  })

  return (
    <>
      <ul className="space-y-2">
        {todos.length === 0 ? (
          <li className="text-muted-foreground py-4 text-center">No todos yet. Add one above!</li>
        ) : (
          todos.map((todo) => (
            <li key={todo.id} className="bg-card flex items-center gap-3 rounded-lg border p-3">
              <input
                type="checkbox"
                checked={todo.completed}
                onChange={() => toggleComplete({ id: todo.id })}
                className="h-5 w-5 cursor-pointer rounded border-gray-300"
              />
              <span className={`flex-1 ${todo.completed ? 'text-muted-foreground line-through' : ''}`}>
                {todo.title}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => deleteTodo({ id: todo.id })}
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                Delete
              </Button>
            </li>
          ))
        )}
      </ul>

      {todos.length > 0 && (
        <p className="text-muted-foreground text-center text-sm">
          {todos.filter((t) => !t.completed).length} of {todos.length} remaining
        </p>
      )}
    </>
  )
}
