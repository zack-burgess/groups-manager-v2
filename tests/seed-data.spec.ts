import { test, expect } from '@playwright/test'

// Verify seed data has adequate coverage: every title and org represented,
// every group has an admin, and Reset Demo restores everything.

// These tests share localStorage state, so run serially
test.describe.configure({ mode: 'serial' })

test.describe('Seed data coverage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    // Reset demo if logged in
    const gear = page.locator('button[title="Settings"]')
    if (await gear.isVisible({ timeout: 1000 }).catch(() => false)) {
      await gear.click()
      await page.getByText('Reset Demo').click()
      await page.waitForURL('**/groups-manager-v2/')
    }
    // Sign in as Zack
    await page.fill('#name', 'Zack Burgess')
    await page.click('button:has-text("Sign In")')
    await page.locator('text=Welcome back').waitFor({ timeout: 3000 })
    await page.waitForURL('**/profile/**')
  })

  test('every predefined title is represented by at least one employee', async ({ page }) => {
    const requiredTitles = [
      'Software Engineer', 'Senior Software Engineer', 'Engineering Manager',
      'Product Manager', 'Product Manager and Builder',
      'Designer', 'UX Researcher', 'Recruiter', 'Data Analyst',
      'Marketing Manager', 'Account Executive', 'HR Manager', 'Legal Counsel',
    ]

    await page.click('text=Manage Employees')
    await page.waitForURL('**/employees**')

    // Wait for employee list to load
    await page.locator('text=Active (').waitFor()
    const pageContent = await page.textContent('body')

    for (const title of requiredTitles) {
      expect(pageContent, `Missing title: ${title}`).toContain(title)
    }
  })

  test('every predefined org is represented by at least one employee', async ({ page }) => {
    const orgs = [
      'Research and Development', 'Marketing', 'Sales',
      'Human Resources', 'Legal', 'Security', 'Data & Analytics',
    ]

    await page.click('text=Manage Employees')
    await page.waitForURL('**/employees**')
    await page.locator('text=Active (').waitFor()
    const pageContent = await page.textContent('body')

    for (const org of orgs) {
      expect(pageContent, `Missing org: ${org}`).toContain(org)
    }
  })

  test('every group has at least one admin', async ({ page }) => {
    // Zack is a member of multiple groups — check each from his profile
    const groups = ['All Employees', 'R&D', 'Product']

    for (const groupName of groups) {
      await page.click(`button:has-text("${groupName}")`)
      await page.waitForURL('**/group/**')

      const adminBadge = page.locator('span:has-text("Admin")').first()
      await expect(adminBadge, `Group "${groupName}" has no admin`).toBeVisible()

      await page.click('text=Groups Manager')
      await page.waitForURL('**/profile/**')
    }

    // Check groups Zack isn't in via direct navigation
    const otherGroups = [
      { name: 'Engineers', id: 'g2' },
      { name: 'Design', id: 'g5' },
      { name: 'Recruiting', id: 'g6' },
    ]
    for (const { name, id } of otherGroups) {
      await page.goto(`/groups-manager-v2/group/${id}`)
      await page.locator(`h2:has-text("${name}")`).waitFor()

      const adminBadge = page.locator('span:has-text("Admin")').first()
      await expect(adminBadge, `Group "${name}" has no admin`).toBeVisible()
    }
  })

  test('Reset Demo restores seed data', async ({ page }) => {
    // Suspend someone to change state
    await page.click('text=Manage Employees')
    await page.waitForURL('**/employees**')
    await page.locator('text=Active (').waitFor()

    const aliceRow = page.locator('li').filter({ hasText: 'Alice Chen' })
    await aliceRow.getByText('Suspend').click()

    // Verify Alice is suspended
    await expect(page.locator('text=Suspended (').first()).toBeVisible()

    // Reset demo
    await page.click('button[title="Settings"]')
    await page.click('text=Reset Demo')
    await page.waitForURL('**/groups-manager-v2/')

    // Sign back in
    await page.fill('#name', 'Zack Burgess')
    await page.click('button:has-text("Sign In")')
    await page.locator('text=Welcome back').waitFor({ timeout: 3000 })
    await page.waitForURL('**/profile/**')

    // Check employee list is restored
    await page.click('text=Manage Employees')
    await page.waitForURL('**/employees**')
    await page.locator('text=Active (').waitFor()

    const pageContent = await page.textContent('body')
    expect(pageContent).toContain('Alice Chen')
    expect(pageContent).toContain('Zack Burgess')
  })
})
