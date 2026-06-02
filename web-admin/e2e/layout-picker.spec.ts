import { test, expect } from './fixtures'

const LEAGUE_CODE = 'wnba'

test('layout-picker: change league to side-by-side, save, reload, layout persists', async ({
  page,
  seededDevice,
}) => {
  await page.goto(`/device/${seededDevice.id}`)
  await page.waitForLoadState('networkidle')

  const badge = LEAGUE_CODE.toUpperCase()
  const leagueCard = page.locator('[class*="rounded-card"]').filter({ hasText: badge }).first()
  await expect(leagueCard).toBeVisible({ timeout: 10_000 })

  // Enable the league (seeded disabled; layout buttons only appear when enabled)
  await leagueCard.locator('button').first().click()

  const sideBySideBtn = leagueCard.getByRole('button', { name: 'Side-by-side' })
  const stackedBtn = leagueCard.getByRole('button', { name: 'Stacked' })
  await expect(sideBySideBtn).toBeVisible({ timeout: 5_000 })

  // Default state: Stacked is active (no text-secondary), Side-by-side is inactive
  const sideBySideClassBefore = await sideBySideBtn.getAttribute('class')
  expect(sideBySideClassBefore).toContain('border-[var(--color-border)]')
  const stackedClassBefore = await stackedBtn.getAttribute('class')
  expect(stackedClassBefore).not.toContain('border-[var(--color-border)]')

  // Switch to Side-by-side
  await sideBySideBtn.click()

  // Active state switches immediately in the UI
  const sideBySideClassAfterClick = await sideBySideBtn.getAttribute('class')
  expect(sideBySideClassAfterClick).not.toContain('border-[var(--color-border)]')

  // Save
  await page.getByRole('button', { name: /^save$/i }).click()
  await expect(page.getByText('Teams saved. Panel updates on its next poll.')).toBeVisible({
    timeout: 10_000,
  })

  // Reload and verify the layout persisted from the DB
  await page.reload()
  await page.waitForLoadState('networkidle')

  const cardAfter = page.locator('[class*="rounded-card"]').filter({ hasText: badge }).first()
  await expect(cardAfter).toBeVisible({ timeout: 10_000 })

  // League should still be enabled — layout buttons must be visible
  const sideBySideBtnAfter = cardAfter.getByRole('button', { name: 'Side-by-side' })
  const stackedBtnAfter = cardAfter.getByRole('button', { name: 'Stacked' })
  await expect(sideBySideBtnAfter).toBeVisible({ timeout: 10_000 })

  // Side-by-side is now the active selection (no border-border class)
  const sideBySideClassAfterReload = await sideBySideBtnAfter.getAttribute('class')
  expect(sideBySideClassAfterReload).not.toContain('border-[var(--color-border)]')

  // Stacked is now inactive (has border-border class)
  const stackedClassAfterReload = await stackedBtnAfter.getAttribute('class')
  expect(stackedClassAfterReload).toContain('border-[var(--color-border)]')
})
