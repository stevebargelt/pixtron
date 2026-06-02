import { test, expect } from './fixtures'

const LEAGUE_CODE = 'wnba'

// Verifies that the Teams tab renders proper empty-state messages for disabled leagues.
// A newly seeded device has all leagues disabled, so the "Enable X to pick favorite teams"
// message must be visible immediately on navigation.
test('empty-state: disabled league shows enable-prompt message', async ({
  page,
  seededDevice,
}) => {
  await page.goto(`/device/${seededDevice.id}`)
  await page.waitForLoadState('networkidle')

  const badge = LEAGUE_CODE.toUpperCase()

  // The WNBA card is visible
  const leagueCard = page.locator('[class*="rounded-card"]').filter({ hasText: badge }).first()
  await expect(leagueCard).toBeVisible({ timeout: 10_000 })

  // Enable button is visible (league is disabled)
  await expect(leagueCard.getByRole('button', { name: 'Enable' })).toBeVisible()

  // Empty-state message is present
  await expect(
    leagueCard.getByText(`Enable ${badge} to pick favorite teams.`)
  ).toBeVisible()

  // The add-team input is NOT visible while league is disabled
  await expect(page.locator(`#add-team-${LEAGUE_CODE}`)).not.toBeVisible()
})

test('empty-state: enabling league removes empty-state and shows add-team input', async ({
  page,
  seededDevice,
}) => {
  await page.goto(`/device/${seededDevice.id}`)
  await page.waitForLoadState('networkidle')

  const badge = LEAGUE_CODE.toUpperCase()
  const leagueCard = page.locator('[class*="rounded-card"]').filter({ hasText: badge }).first()
  await expect(leagueCard).toBeVisible({ timeout: 10_000 })

  // Confirm empty state is shown
  await expect(leagueCard.getByText(`Enable ${badge} to pick favorite teams.`)).toBeVisible()

  // Enable the league
  await leagueCard.getByRole('button', { name: 'Enable' }).click()

  // Empty-state message disappears
  await expect(
    leagueCard.getByText(`Enable ${badge} to pick favorite teams.`)
  ).not.toBeVisible({ timeout: 5_000 })

  // Add-team input appears
  await expect(page.locator(`#add-team-${LEAGUE_CODE}`)).toBeVisible({ timeout: 5_000 })
})
