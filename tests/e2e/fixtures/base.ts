import { readFileSync } from 'node:fs'
import path from 'node:path'
import type { Page } from '@playwright/test'
import { test as base, expect as baseExpect } from '@playwright/test'
import { Client } from 'pg'

const TEST_DB_URL_PATH = path.resolve('tests/e2e/.test-db-url')

class TodosPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/todos', { waitUntil: 'networkidle' })
    // Wait for suspense to resolve — either the empty state or actual list items
    await this.page.getByText('No todos yet').or(this.page.locator('ul > li').first()).waitFor({ timeout: 15_000 })
  }

  async addTodo(title: string) {
    const input = this.page.getByPlaceholder('What needs to be done?')
    const addButton = this.page.getByRole('button', { name: 'Add' })
    const item = this.page.getByRole('listitem').filter({ hasText: title }).first()

    // Retry loop handles pre-hydration where click does nothing
    await baseExpect(async () => {
      if (!(await item.isVisible().catch(() => false))) {
        await input.fill(title)
        const listResponse = this.page.waitForResponse('**/api/rpc/todo/list')
        await addButton.click()
        await listResponse
      }
      await item.waitFor({ state: 'visible', timeout: 3_000 })
    }).toPass({ timeout: 30_000, intervals: [1_000] })
  }

  async toggleTodo(title: string) {
    const row = this.page.getByRole('listitem').filter({ hasText: title }).first()
    const checkbox = row.getByRole('checkbox')
    const wasChecked = await checkbox.isChecked()

    await baseExpect(async () => {
      if ((await checkbox.isChecked()) === wasChecked) {
        const listResponse = this.page.waitForResponse('**/api/rpc/todo/list')
        await checkbox.click()
        await listResponse
      }
      const current = await checkbox.isChecked()
      if (current === wasChecked) {
        throw new Error(`Checkbox still ${wasChecked ? 'checked' : 'unchecked'}`)
      }
    }).toPass({ timeout: 15_000, intervals: [1_000] })
  }

  async deleteTodo(title: string) {
    const row = this.page.getByRole('listitem').filter({ hasText: title }).first()
    const listResponse = this.page.waitForResponse('**/api/rpc/todo/list')
    await row.getByRole('button', { name: 'Delete' }).click()
    await listResponse
    await row.waitFor({ state: 'detached' })
  }

  todoItem(title: string) {
    return this.page.getByRole('listitem').filter({ hasText: title }).first()
  }
}

export const test = base.extend<{ todosPage: TodosPage }, { db: Client }>({
  db: [
    // eslint-disable-next-line no-empty-pattern
    async ({}, use) => {
      const dbUrl = readFileSync(TEST_DB_URL_PATH, 'utf-8').trim()
      const client = new Client({ connectionString: dbUrl })
      await client.connect()
      await use(client)
      await client.end()
    },
    { scope: 'worker' },
  ],

  todosPage: async ({ page, db }, use) => {
    await db.query('TRUNCATE todos')
    await use(new TodosPage(page))
  },
})

export { expect } from '@playwright/test'
