import { expect, test } from './fixtures/base'

test.describe('Posts Page', () => {
  test.describe.configure({ mode: 'serial' })

  test('empty state shows the Populate Posts button', async ({ db, page }) => {
    await db.query('TRUNCATE posts')
    await page.goto('/posts', { waitUntil: 'networkidle' })

    await expect(page.getByRole('button', { name: 'Populate Posts' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Populate Posts' })).toBeEnabled()
    await expect(page.locator('ul > li')).toHaveCount(0)
  })

  test('clicking Populate Posts fetches and displays posts', async ({ page }) => {
    await page.goto('/posts', { waitUntil: 'networkidle' })

    const populateButton = page.getByRole('button', {
      name: 'Populate Posts',
    })
    await expect(populateButton).toBeVisible()

    const populateResponse = page.waitForResponse('**/api/rpc/post/populate')
    await populateButton.click()

    // Button shows loading state
    await expect(page.getByRole('button', { name: 'Populating…' })).toBeDisabled()

    await populateResponse

    // Button disappears and posts appear
    await expect(page.getByRole('button', { name: 'Populate Posts' })).not.toBeVisible()
    const listItems = page.locator('ul > li')
    await expect(listItems.first()).toBeVisible()
    const count = await listItems.count()
    expect(count).toBeGreaterThan(0)
  })

  test('Populate Posts button is hidden after posts are loaded', async ({ page }) => {
    await page.goto('/posts', { waitUntil: 'networkidle' })

    // Posts were populated by the previous test — button should already be hidden
    // If empty state is shown (e.g. parallel worker interference), populate first
    const populateButton = page.getByRole('button', { name: 'Populate Posts' })
    if (await populateButton.isVisible({ timeout: 2_000 }).catch(() => false)) {
      const populateResponse = page.waitForResponse('**/api/rpc/post/populate')
      await populateButton.click()
      await populateResponse
    }

    await expect(page.locator('ul > li').first()).toBeVisible({ timeout: 10_000 })
    await expect(populateButton).not.toBeVisible()

    const count = await page.locator('ul > li').count()
    expect(count).toBeGreaterThan(0)
  })
})
