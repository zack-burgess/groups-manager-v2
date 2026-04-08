import { test, expect } from '@playwright/test'

// Test auto-membership triggers: On Create, On Update, and suspend/rehire.

test.describe.configure({ mode: 'serial' })

test.describe('Auto-membership triggers', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    const gear = page.locator('button[title="Settings"]')
    if (await gear.isVisible({ timeout: 1000 }).catch(() => false)) {
      await gear.click()
      await page.getByText('Reset Demo').click()
      await page.waitForURL('**/groups-manager-v2/')
    }
    // Sign in as Zack (system admin)
    await page.fill('#name', 'Zack Burgess')
    await page.click('button:has-text("Sign In")')
    await page.locator('text=Welcome back').waitFor({ timeout: 3000 })
    await page.waitForURL('**/profile/**')
  })

  test('On Create: new employee matching rule is auto-added to group', async ({ page }) => {
    // Engineers group rule: title is one of [Software Engineer, Senior Software Engineer, Engineering Manager]
    await page.click('text=Manage Employees')
    await page.waitForURL('**/employees**')
    await page.locator('text=Active (').waitFor()

    await page.click('text=+ Create Employee')
    await page.waitForURL('**/setup**')

    await page.fill('#name', 'New Engineer')
    await page.selectOption('#title', 'Software Engineer')
    await page.selectOption('#org', 'Research and Development')
    await page.click('button:has-text("Create Employee")')
    await page.waitForURL('**/employees**')

    // Navigate to Engineers group via search
    await page.fill('input[placeholder="Search people and groups…"]', 'Engineers')
    await page.press('input[placeholder="Search people and groups…"]', 'Enter')
    await page.waitForURL('**/search**')
    // Click the group result, not a person result
    await page.locator('section').filter({ hasText: 'Groups' }).locator('button').filter({ hasText: 'Engineers' }).click()
    await page.waitForURL('**/group/**')

    await expect(page.locator('text=New Engineer')).toBeVisible()

    // Check history
    await page.click('button:has-text("History")')
    await expect(page.locator('text=New Engineer added by Auto-Membership')).toBeVisible()
  })

  test('On Update: changing title to match rule adds employee to group', async ({ page }) => {
    // Engineers group has triggerOnUpdate: true
    // Update James Wilson (Marketing Manager) to Software Engineer
    await page.click('text=Manage Employees')
    await page.waitForURL('**/employees**')
    await page.locator('text=Active (').waitFor()

    const jamesRow = page.locator('li').filter({ hasText: 'James Wilson' })
    await jamesRow.getByText('Update').click()

    // Modal opens — select title in the modal
    await page.locator('.fixed select').first().selectOption('Software Engineer')
    await page.locator('.fixed button:has-text("Update")').click()

    // Navigate to Engineers group
    await page.fill('input[placeholder="Search people and groups…"]', 'Engineers')
    await page.press('input[placeholder="Search people and groups…"]', 'Enter')
    await page.waitForURL('**/search**')
    await page.locator('section').filter({ hasText: 'Groups' }).locator('button').filter({ hasText: 'Engineers' }).click()
    await page.waitForURL('**/group/**')

    await expect(page.locator('text=James Wilson')).toBeVisible()
  })

  test('On Update: changing title when triggerOnUpdate is false does NOT add to group', async ({ page }) => {
    // Product group has triggerOnUpdate: false
    // Update Ethan Davis to Product Manager — should NOT be added to Product
    await page.click('text=Manage Employees')
    await page.waitForURL('**/employees**')
    await page.locator('text=Active (').waitFor()

    const ethanRow = page.locator('li').filter({ hasText: 'Ethan Davis' })
    await ethanRow.getByText('Update').click()

    await page.locator('.fixed select').first().selectOption('Product Manager')
    await page.locator('.fixed button:has-text("Update")').click()

    // Navigate directly to Product group
    await page.goto('/groups-manager-v2/group/g4')
    await page.locator('h2:has-text("Product")').waitFor()

    // Ethan should NOT be a member
    const membersText = await page.locator('main').textContent()
    expect(membersText).not.toContain('Ethan Davis')
  })

  test('Suspend: employee is removed from all groups', async ({ page }) => {
    // Alice Chen is in All Employees, Engineers, and R&D
    await page.click('text=Manage Employees')
    await page.waitForURL('**/employees**')
    await page.locator('text=Active (').waitFor()

    const aliceRow = page.locator('li').filter({ hasText: 'Alice Chen' })
    await aliceRow.getByText('Suspend').click()

    // Navigate to Engineers group
    await page.fill('input[placeholder="Search people and groups…"]', 'Engineers')
    await page.press('input[placeholder="Search people and groups…"]', 'Enter')
    await page.waitForURL('**/search**')
    await page.locator('section').filter({ hasText: 'Groups' }).locator('button').filter({ hasText: 'Engineers' }).click()
    await page.waitForURL('**/group/**')

    // Alice should be gone from members
    const membersContent = await page.locator('ul').first().textContent()
    expect(membersContent).not.toContain('Alice Chen')

    // Check history shows removal
    await page.click('button:has-text("History")')
    await expect(page.locator('text=Alice Chen removed on Suspend')).toBeVisible()
  })

  test('Rehire: employee is re-evaluated against Create rules', async ({ page }) => {
    // Chris Lee (Data Analyst) is suspended — rehire should re-add to All Employees
    await page.click('text=Manage Employees')
    await page.waitForURL('**/employees**')
    await page.locator('text=Active (').waitFor()

    const chrisRow = page.locator('li').filter({ hasText: 'Chris Lee' })
    await chrisRow.getByText('Rehire').click()

    // Navigate to All Employees
    await page.click('text=Groups Manager')
    await page.waitForURL('**/profile/**')
    await page.click('button:has-text("All Employees")')
    await page.waitForURL('**/group/**')

    await expect(page.locator('text=Chris Lee')).toBeVisible()
  })
})
