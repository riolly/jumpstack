import { expect, test } from './fixtures/base'

test.describe('Todos', () => {
  test.describe.configure({ mode: 'serial' })
  test('empty state is shown when no todos exist', async ({ todosPage, page }) => {
    await todosPage.goto()

    await expect(page.getByText('Todo List')).toBeVisible()
    await expect(page.getByPlaceholder('What needs to be done?')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Add' })).toBeVisible()
    await expect(page.getByText('No todos yet. Add one above!')).toBeVisible()
    await expect(page.getByText(/remaining/)).not.toBeVisible()
  })

  test('Add button is disabled when the input has been cleared', async ({ todosPage, page }) => {
    await todosPage.goto()

    const addButton = page.getByRole('button', { name: 'Add' })
    const input = page.getByPlaceholder('What needs to be done?')

    // Type something then clear it to trigger onChange validation
    await input.fill('temp')
    await input.fill('')
    await expect(addButton).toBeDisabled()

    await input.fill('Buy milk')
    await expect(addButton).toBeEnabled()
  })

  test('adding a single todo displays it in the list and shows the counter', async ({ todosPage, page }) => {
    await todosPage.goto()
    await expect(page.getByText('No todos yet. Add one above!')).toBeVisible()

    await todosPage.addTodo('Buy milk')

    await expect(page.getByText('No todos yet. Add one above!')).not.toBeVisible()
    await expect(page.getByRole('listitem').filter({ hasText: 'Buy milk' })).toBeVisible()
    await expect(page.getByText('1 of 1 remaining')).toBeVisible()
    await expect(page.getByPlaceholder('What needs to be done?')).toHaveValue('')
  })

  test('adding multiple todos renders them all and updates the counter', async ({ todosPage, page }) => {
    await todosPage.goto()

    await todosPage.addTodo('Task A')
    await expect(page.getByText('1 of 1 remaining')).toBeVisible()

    await todosPage.addTodo('Task B')
    await expect(page.getByText('2 of 2 remaining')).toBeVisible()

    await todosPage.addTodo('Task C')
    await expect(page.getByText('3 of 3 remaining')).toBeVisible()

    await expect(page.getByRole('listitem').filter({ hasText: 'Task A' })).toBeVisible()
    await expect(page.getByRole('listitem').filter({ hasText: 'Task B' })).toBeVisible()
    await expect(page.getByRole('listitem').filter({ hasText: 'Task C' })).toBeVisible()
  })

  test('completing a todo applies line-through styling and updates the counter', async ({ todosPage, page }) => {
    await todosPage.goto()
    await todosPage.addTodo('Write tests')
    await expect(page.getByText('1 of 1 remaining')).toBeVisible()

    await todosPage.toggleTodo('Write tests')

    const row = page.getByRole('listitem').filter({ hasText: 'Write tests' })
    await expect(row.getByRole('checkbox')).toBeChecked()
    await expect(row.locator('span.line-through')).toBeVisible()
    await expect(page.getByText('0 of 1 remaining')).toBeVisible()
  })

  test('toggling a completed todo back to incomplete removes line-through', async ({ todosPage, page }) => {
    await todosPage.goto()
    await todosPage.addTodo('Refactor code')
    await todosPage.toggleTodo('Refactor code')
    await expect(page.getByText('0 of 1 remaining')).toBeVisible({ timeout: 10_000 })

    await todosPage.toggleTodo('Refactor code')

    const row = page.getByRole('listitem').filter({ hasText: 'Refactor code' })
    await expect(row.getByRole('checkbox')).not.toBeChecked()
    await expect(row.locator('span.line-through')).not.toBeVisible()
    await expect(page.getByText('1 of 1 remaining')).toBeVisible()
  })

  test('deleting a todo removes it from the list', async ({ todosPage, page }) => {
    await todosPage.goto()
    await todosPage.addTodo('Read a book')
    await expect(page.getByRole('listitem').filter({ hasText: 'Read a book' })).toBeVisible()

    await todosPage.deleteTodo('Read a book')

    await expect(page.getByRole('listitem').filter({ hasText: 'Read a book' })).not.toBeVisible()
    await expect(page.getByText('No todos yet. Add one above!')).toBeVisible()
    await expect(page.getByText(/remaining/)).not.toBeVisible()
  })

  test('deleting one todo from a multi-item list leaves the others intact', async ({ todosPage, page }) => {
    await todosPage.goto()
    await todosPage.addTodo('Alpha')
    await todosPage.addTodo('Beta')
    await todosPage.addTodo('Gamma')
    await expect(page.getByText('3 of 3 remaining')).toBeVisible()

    await todosPage.deleteTodo('Beta')

    await expect(page.getByRole('listitem').filter({ hasText: 'Beta' })).not.toBeVisible()
    await expect(page.getByRole('listitem').filter({ hasText: 'Alpha' })).toBeVisible()
    await expect(page.getByRole('listitem').filter({ hasText: 'Gamma' })).toBeVisible()
    await expect(page.getByText('2 of 2 remaining')).toBeVisible()
  })

  test('counter correctly reflects a mix of completed and incomplete todos', async ({ todosPage, page }) => {
    await todosPage.goto()

    // Avoid names like "One" which case-insensitively matches "No todos yet. Add one above!"
    await todosPage.addTodo('First')
    await todosPage.addTodo('Second')
    await todosPage.addTodo('Third')
    await expect(page.getByText('3 of 3 remaining')).toBeVisible({ timeout: 10_000 })

    await todosPage.toggleTodo('First')
    await expect(page.getByText('2 of 3 remaining')).toBeVisible({ timeout: 10_000 })

    await todosPage.toggleTodo('Second')
    await expect(page.getByText('1 of 3 remaining')).toBeVisible({ timeout: 10_000 })

    await todosPage.deleteTodo('Third')
    await expect(page.getByText('0 of 2 remaining')).toBeVisible({ timeout: 10_000 })
  })
})
