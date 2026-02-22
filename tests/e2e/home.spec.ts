import { expect, test } from '@playwright/test'

import { appMeta, GITHUB_URL, techStack } from '#/lib/app-meta'

test.describe('Home Page', () => {
  test('hero section renders JumpStack branding and tagline', async ({ page }) => {
    await page.goto('/')

    await expect(page).toHaveTitle('JumpStack')
    await expect(page.getByRole('heading', { level: 1, name: 'JumpStack' })).toBeVisible()
    await expect(page.getByText(`// ${appMeta.tagline}`)).toBeVisible()
    await expect(page.getByText(appMeta.description)).toBeVisible()
  })

  test('CTA buttons are present and link to GitHub', async ({ page }) => {
    await page.goto('/')

    const starButton = page.getByRole('link', { name: 'Star on GitHub' })
    await expect(starButton).toBeVisible()
    await expect(starButton).toHaveAttribute('href', GITHUB_URL)
    await expect(starButton).toHaveAttribute('target', '_blank')
    await expect(starButton).toHaveAttribute('rel', /noopener/)

    const getStarted = page.getByRole('link', { name: 'Get Started' })
    await expect(getStarted).toBeVisible()
    await expect(getStarted).toHaveAttribute('href', GITHUB_URL)
    await expect(getStarted).toHaveAttribute('target', '_blank')
    await expect(getStarted).toHaveAttribute('rel', /noopener/)
  })

  test('tech stack entries are visible and link to correct external URLs', async ({ page }) => {
    await page.goto('/')

    for (const stack of techStack) {
      await expect(page.getByText(stack.name)).toBeVisible()
      await expect(page.getByText(stack.desc)).toBeVisible()
      await expect(page.getByRole('link', { name: stack.name })).toBeVisible()
    }
  })
})
