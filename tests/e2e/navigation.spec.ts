import { expect, test } from '@playwright/test'

test.describe('Navigation', () => {
  test('all nav links are present and navigate to their routes', async ({ page }) => {
    await page.goto('/')

    const nav = page.getByRole('navigation', { name: 'Main navigation' })
    await expect(nav.getByRole('link', { name: 'Home' })).toBeVisible()
    await expect(nav.getByRole('link', { name: 'Posts' })).toBeVisible()
    await expect(nav.getByRole('link', { name: 'Todos' })).toBeVisible()
    await expect(nav.getByRole('link', { name: 'User' })).toBeVisible()
    await expect(nav.getByRole('link', { name: 'Sign In' })).toBeVisible()

    await nav.getByRole('link', { name: 'Posts' }).click()
    await expect(page).toHaveURL('/posts')

    await nav.getByRole('link', { name: 'Todos' }).click()
    await expect(page).toHaveURL('/todos')

    await nav.getByRole('link', { name: 'User' }).click()
    await expect(page).toHaveURL('/signin')

    await nav.getByRole('link', { name: 'Home' }).click()
    await expect(page).toHaveURL('/')
    await expect(page.getByRole('heading', { level: 1, name: 'JumpStack' })).toBeVisible()
  })

  test('active nav link receives the font-bold class', async ({ page }) => {
    await page.goto('/')

    const nav = page.getByRole('navigation', { name: 'Main navigation' })
    const homeLink = nav.getByRole('link', { name: 'Home' })
    const postsLink = nav.getByRole('link', { name: 'Posts' })
    const todosLink = nav.getByRole('link', { name: 'Todos' })

    await expect(homeLink).toHaveClass(/font-bold/)
    await expect(postsLink).not.toHaveClass(/font-bold/)

    await postsLink.click()
    await expect(postsLink).toHaveClass(/font-bold/)
    await expect(homeLink).not.toHaveClass(/font-bold/)

    await todosLink.click()
    await expect(todosLink).toHaveClass(/font-bold/)
    await expect(postsLink).not.toHaveClass(/font-bold/)
  })

  test('theme toggle switches between dark and light mode', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' })

    const html = page.locator('html')
    const initialTheme = (await html.getAttribute('class'))?.includes('dark') ? 'dark' : 'light'

    const toggleButton = page.getByRole('button', { name: 'Toggle theme' })
    await toggleButton.click()

    if (initialTheme === 'light') {
      await expect(html).toHaveClass(/dark/)
    } else {
      await expect(html).toHaveClass(/light/)
    }

    await toggleButton.click()
    if (initialTheme === 'light') {
      await expect(html).toHaveClass(/light/)
    } else {
      await expect(html).toHaveClass(/dark/)
    }

    await page.reload()
    if (initialTheme === 'light') {
      await expect(html).toHaveClass(/light/)
    } else {
      await expect(html).toHaveClass(/dark/)
    }
  })

  test('auth button shows Sign In link when logged out', async ({ page }) => {
    await page.goto('/')

    const nav = page.getByRole('navigation', { name: 'Main navigation' })
    await expect(nav.getByRole('link', { name: 'Sign In' })).toBeVisible()
    await expect(nav.getByRole('button', { name: 'Sign Out' })).not.toBeVisible()

    await nav.getByRole('link', { name: 'Sign In' }).click()
    await expect(page).toHaveURL('/signin')
  })

  test('unauthenticated access to /user redirects to /signin', async ({ page }) => {
    await page.goto('/user')
    await expect(page).toHaveURL('/signin')
    await expect(page.locator('[data-slot="card-title"]', { hasText: 'Sign In' })).toBeVisible()
  })
})
