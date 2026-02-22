import { expect } from '@playwright/test'

import { test } from './fixtures/base'

test.describe('Sign In Page', () => {
  test('sign up then sign in', async ({ page, db }) => {
    const name = 'Test User'
    const email = `testuser-${Date.now()}@example.com`
    const password = 'testpassword123'

    // Clean up any previous auth data
    await db.query('TRUNCATE account, session, "user" CASCADE')

    // Sign up
    await page.goto('/signup', { waitUntil: 'networkidle' })
    const nameInput = page.getByLabel('Name')
    const signupEmail = page.getByLabel('Email')
    const signupPassword = page.getByLabel('Password')

    await nameInput.fill(name)
    await nameInput.blur()
    await signupEmail.fill(email)
    await signupEmail.blur()
    await signupPassword.fill(password)
    await signupPassword.blur()

    await page.getByRole('button', { name: 'Sign Up with Email' }).click()

    await expect(page).toHaveURL('/user', { timeout: 10_000 })
    await expect(page.getByText(`Welcome, ${name}!`)).toBeVisible()

    // Sign out by clearing session (navigate to signin)
    await page.context().clearCookies()
    await page.goto('/signin', { waitUntil: 'networkidle' })

    // Sign in with the same credentials
    await page.getByLabel('Email').fill(email)
    await page.getByLabel('Password').fill(password)
    await page.getByRole('button', { name: 'Sign In with Email' }).click()

    await expect(page).toHaveURL('/user', { timeout: 10_000 })
    await expect(page.getByText(`Welcome, ${name}!`)).toBeVisible()
    await expect(page.getByText(`Email: ${email}`)).toBeVisible()
  })

  test('submitting with invalid credentials shows an error message', async ({ page }) => {
    await page.goto('/signin', { waitUntil: 'networkidle' })

    const emailInput = page.getByLabel('Email')
    const passwordInput = page.getByLabel('Password')
    const submitButton = page.getByRole('button', {
      name: 'Sign In with Email',
    })

    await emailInput.fill('nonexistent@example.com')
    await emailInput.blur()
    await passwordInput.fill('wrongpassword')
    await passwordInput.blur()
    await expect(submitButton).toBeEnabled()

    await submitButton.click()

    // Button shows loading state
    await expect(page.getByRole('button', { name: 'Signing in…' })).toBeVisible()

    // Error message appears after response
    await expect(page.locator('.text-destructive')).toBeVisible({
      timeout: 10_000,
    })
    await expect(page).toHaveURL('/signin')
  })

  test('Sign In page is accessible from the nav bar', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' })

    const nav = page.getByRole('navigation', { name: 'Main navigation' })
    await nav.getByRole('link', { name: 'Sign In' }).click()
    await expect(page).toHaveURL('/signin')
    await expect(page.locator('[data-slot="card-title"]', { hasText: 'Sign In' })).toBeVisible()
  })
})
