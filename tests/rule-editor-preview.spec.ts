import { test, expect } from '@playwright/test'

// Test the rule editor preview: live matching, AND/OR logic,
// staging non-members, and different operators.

test.describe.configure({ mode: 'serial' })

test.describe('Rule editor preview', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    const gear = page.locator('button[title="Settings"]')
    if (await gear.isVisible({ timeout: 1000 }).catch(() => false)) {
      await gear.click()
      await page.getByText('Reset Demo').click()
      await page.waitForURL('**/groups-manager-v2/')
    }
    // Sign in as new user to get a fresh Recruiting group (no rules)
    await page.fill('#name', 'Preview Tester')
    await page.click('button:has-text("Sign In")')
    await page.waitForURL('**/setup**')
    await page.click('button:has-text("Complete Setup")')
    await page.waitForURL('**/profile/**')

    // Navigate to Recruiting and open rule editor
    await page.click('button:has-text("Recruiting")')
    await page.waitForURL('**/group/**')
    await page.click('button[title="Edit rules"]')
    await page.waitForURL('**/rules**')
  })

  test('preview shows empty state when no filter is set', async ({ page }) => {
    await expect(page.locator('text=Set a filter above to see matches.')).toBeVisible()
  })

  test('preview updates live as filter value is entered', async ({ page }) => {
    const valueInput = page.locator('input[placeholder="Enter title…"]')
    await valueInput.fill('Software Engineer')
    await page.locator('li:has-text("Software Engineer")').first().click()

    await expect(page.locator('text=Matches')).toBeVisible()
    await expect(page.locator('text=Alice Chen')).toBeVisible()
  })

  test('"is" operator matches exact title', async ({ page }) => {
    const valueInput = page.locator('input[placeholder="Enter title…"]')
    await valueInput.fill('Software Engineer')
    await page.locator('li:has-text("Software Engineer")').first().click()

    // Alice Chen is Software Engineer — should match
    await expect(page.locator('text=Alice Chen')).toBeVisible()
    // Marcus Webb is Senior Software Engineer — should NOT match "is"
    const previewBox = page.locator('.divide-y')
    const previewContent = await previewBox.textContent()
    expect(previewContent).not.toContain('Marcus Webb')
  })

  test('"contains" operator matches partial values', async ({ page }) => {
    // Change operator to "contains"
    const operatorSelect = page.locator('select').nth(1)
    await operatorSelect.selectOption('contains')

    const valueInput = page.locator('input[placeholder="Enter title…"]')
    await valueInput.fill('Engineer')
    await valueInput.press('Tab')

    // Should match Software Engineer, Senior Software Engineer, Engineering Manager
    await expect(page.locator('text=Matches')).toBeVisible()
    await expect(page.locator('text=Alice Chen')).toBeVisible()
    await expect(page.locator('text=Marcus Webb')).toBeVisible()
  })

  test('no matches shows appropriate message', async ({ page }) => {
    const valueInput = page.locator('input[placeholder="Enter title…"]')
    await valueInput.fill('Nonexistent Title')
    await valueInput.press('Tab')

    await expect(page.locator('text=No people match these rules')).toBeVisible()
  })

  test('AND combinator requires all conditions to match', async ({ page }) => {
    // First condition: title is Software Engineer
    const valueInput = page.locator('input[placeholder="Enter title…"]')
    await valueInput.fill('Software Engineer')
    await page.locator('li:has-text("Software Engineer")').first().click()

    // Add second condition
    await page.click('text=+ Add Condition')

    // Set second condition field to organization
    const fieldSelects = page.locator('select')
    await fieldSelects.nth(2).selectOption('organization')

    const orgInput = page.locator('input[placeholder="Enter organization…"]')
    await orgInput.fill('Security')
    await page.locator('li:has-text("Security")').click()

    // AND: no one is Software Engineer AND in Security
    await expect(page.locator('text=No people match these rules')).toBeVisible()
  })

  test('OR combinator matches any condition', async ({ page }) => {
    // First condition: title is Designer
    const valueInput = page.locator('input[placeholder="Enter title…"]')
    await valueInput.fill('Designer')
    await page.locator('li:has-text("Designer")').first().click()

    // Add second condition
    await page.click('text=+ Add Condition')

    // Second condition: title is Recruiter
    const secondValueInput = page.locator('input[placeholder="Enter title…"]').nth(1)
    await secondValueInput.fill('Recruiter')
    await page.locator('li:has-text("Recruiter")').click()

    // Switch to OR
    await page.locator('button:has-text("AND")').click()

    // Should match Emily Torres (Designer) and Ryan O'Brien (Recruiter)
    await expect(page.locator('text=Emily Torres')).toBeVisible()
    await expect(page.locator("text=Ryan O'Brien")).toBeVisible()
  })

  test('staging non-members changes their badge to Queued Member', async ({ page }) => {
    const valueInput = page.locator('input[placeholder="Enter title…"]')
    await valueInput.fill('Product Manager and Builder')
    await page.locator('li:has-text("Product Manager and Builder")').first().click()

    // Zack should appear with Non-Member badge
    await expect(page.getByText('Non-Member', { exact: true })).toBeVisible()

    // Click Add Non-Members
    await page.click('button:has-text("+ Add Non-Members")')

    // Should now show Queued Member
    await expect(page.getByText('Queued Member', { exact: true })).toBeVisible()
  })

  test('removing a filter clears the preview', async ({ page }) => {
    const valueInput = page.locator('input[placeholder="Enter title…"]')
    await valueInput.fill('Designer')
    await page.locator('li:has-text("Designer")').first().click()

    await expect(page.locator('text=Matches')).toBeVisible()

    // Clear the filter via the X button
    await page.locator('.rounded-lg.border.border-gray-200.bg-gray-50 button:has-text("✕")').click()

    await expect(page.locator('text=Set a filter above to see matches.')).toBeVisible()
  })
})
