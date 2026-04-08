import { test, expect } from '@playwright/test'

// Full guided callout flow for a new user discovering auto-membership on Recruiting.
// Flow: sign up → profile page hint → click Recruiting → AM pencil hint →
//       rule editor filter hint → add non-members hint → save hint →
//       group detail history hint → click history → hint gone

test.describe('Auto-membership callout flow', () => {
  test.beforeEach(async ({ page }) => {
    // Start fresh: navigate to app, reset demo if needed
    await page.goto('/')
    // If already logged in, reset demo
    const gear = page.locator('button[title="Settings"]')
    if (await gear.isVisible({ timeout: 1000 }).catch(() => false)) {
      await gear.click()
      await page.getByText('Reset Demo').click()
      await page.waitForURL('**/groups-manager-v2/')
    }
  })

  test('new user sees full callout sequence through Recruiting', async ({ page }) => {
    // Step 1: Sign up as a new user
    await page.goto('/')
    expect(await page.textContent('p.text-sm')).toContain('Sign in to try this prototype.')

    await page.fill('#name', 'Test User')
    await page.click('button:has-text("Sign In")')

    // Should go to setup page
    await page.waitForURL('**/setup**')
    await page.locator('text=These fields determine which groups you belong to.').waitFor()

    // Complete setup with defaults (Hiring Manager, Human Resources)
    await page.click('button:has-text("Complete Setup")')

    // Step 2: Profile page — should see Recruiting with yellow callout
    await page.waitForURL('**/profile/**')
    const recruitingHint = page.locator('text=Click on Recruiting and set up Auto-Membership.')
    await expect(recruitingHint).toBeVisible()

    // Click into Recruiting
    await page.click('button:has-text("Recruiting")')

    // Step 3: Group detail — should see AM pencil callout
    await page.waitForURL('**/group/**')
    const pencilHint = page.locator('text=to configure Auto-Membership.')
    await expect(pencilHint).toBeVisible()

    // The description text should be visible
    await expect(page.locator('text=Automatically add members based on title, org, and/or email.')).toBeVisible()

    // Click pencil to go to rule editor
    await page.click('button[title="Edit rules"]')

    // Step 4: Rule editor — should see filter callout
    await page.waitForURL('**/rules**')
    const filterHint = page.locator('text=Try entering title is "Product Manager and Builder."')
    await expect(filterHint).toBeVisible()

    // On Update should be checked by default
    const onUpdateCheckbox = page.locator('input[type="checkbox"]').nth(1)
    await expect(onUpdateCheckbox).toBeChecked()

    // Preview should show empty state
    await expect(page.locator('text=Set a filter above to see matches.')).toBeVisible()

    // Step 5: Enter the suggested filter value
    const valueInput = page.locator('input[placeholder="Enter title…"]')
    await valueInput.fill('Product Manager and Builder')
    // Select from dropdown
    await page.click('li:has-text("Product Manager and Builder")')

    // Filter hint should disappear
    await expect(filterHint).not.toBeVisible()

    // Step 6: Add Non-Members callout should appear
    const addHint = page.locator('text=Click "+ Add Non-Members" to stage them.')
    await expect(addHint).toBeVisible()

    // Preview should show matches now
    await expect(page.locator('text=Zack Burgess')).toBeVisible()

    // Click + Add Non-Members
    await page.click('button:has-text("+ Add Non-Members")')

    // Add hint should disappear
    await expect(addHint).not.toBeVisible()

    // Step 7: Save callout should appear
    const saveHint = page.locator('text=Save your rule to activate Auto-Membership.')
    await expect(saveHint).toBeVisible()

    // Click Save Rule
    await page.click('button:has-text("Save Rule")')

    // Step 8: Back on group detail — history callout should appear
    await page.waitForURL('**/group/**')
    await expect(page.locator('**/rules**')).not.toBeVisible
    const historyHint = page.locator('text=Click History to see who was automatically added.')
    await expect(historyHint).toBeVisible()

    // Zack Burgess should now be in the members list
    await expect(page.locator('text=Zack Burgess')).toBeVisible()

    // Step 9: Click History — callout should disappear
    await page.click('button:has-text("History")')
    await expect(historyHint).not.toBeVisible()

    // History should show the auto-add event
    await expect(page.locator('text=Zack Burgess added by Auto-Membership')).toBeVisible()
  })

  test('callouts only appear on Recruiting, not other groups', async ({ page }) => {
    // Sign in as existing user (Zack Burgess is system admin)
    await page.goto('/')
    await page.fill('#name', 'Zack Burgess')
    await page.click('button:has-text("Sign In")')
    await page.waitForURL('**/profile/**')

    // Navigate to a group that isn't Recruiting (e.g., Product)
    await page.click('button:has-text("Product")')
    await page.waitForURL('**/group/**')

    // Should NOT see the yellow callout hints
    const pencilHint = page.locator('text=to configure Auto-Membership.')
    await expect(pencilHint).not.toBeVisible()
  })

  test('browser back from group page goes to profile after saving rules', async ({ page }) => {
    // Sign up as new user (who becomes admin of Recruiting)
    await page.goto('/')
    await page.fill('#name', 'Nav Test User')
    await page.click('button:has-text("Sign In")')
    await page.waitForURL('**/setup**')
    await page.click('button:has-text("Complete Setup")')
    await page.waitForURL('**/profile/**')

    // Profile → Recruiting → pencil → save rule
    await page.click('button:has-text("Recruiting")')
    await page.waitForURL('**/group/**')
    await page.click('button[title="Edit rules"]')
    await page.waitForURL('**/rules**')

    const valueInput = page.locator('input[placeholder="Enter title…"]')
    await valueInput.fill('Product Manager and Builder')
    await page.click('li:has-text("Product Manager and Builder")')
    await page.click('button:has-text("+ Add Non-Members")')
    await page.click('button:has-text("Save Rule")')
    await page.waitForURL('**/group/**')

    // Browser back should go to profile, not the group page again
    await page.goBack()
    await page.waitForURL('**/profile/**')
  })

  test('profile page hint disappears after rules are configured on Recruiting', async ({ page }) => {
    // Sign up as new user
    await page.goto('/')
    await page.fill('#name', 'Hint Test User')
    await page.click('button:has-text("Sign In")')
    await page.waitForURL('**/setup**')
    await page.click('button:has-text("Complete Setup")')
    await page.waitForURL('**/profile/**')

    // Hint should be visible
    const recruitingHint = page.locator('text=Click on Recruiting and set up Auto-Membership.')
    await expect(recruitingHint).toBeVisible()

    // Go to Recruiting and set up a rule
    await page.click('button:has-text("Recruiting")')
    await page.click('button[title="Edit rules"]')
    await page.waitForURL('**/rules**')

    // Enter a filter and save
    const valueInput = page.locator('input[placeholder="Enter title…"]')
    await valueInput.fill('Product Manager and Builder')
    await page.click('li:has-text("Product Manager and Builder")')
    await page.click('button:has-text("+ Add Non-Members")')
    await page.click('button:has-text("Save Rule")')
    await page.waitForURL('**/group/**')

    // Go back to profile
    await page.click('text=Groups Manager')
    await page.waitForURL('**/profile/**')

    // Hint should be gone
    await expect(recruitingHint).not.toBeVisible()
  })
})
