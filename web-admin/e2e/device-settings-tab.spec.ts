import { test, expect } from './fixtures'

// Exercises the Settings tab on the device page — verifies the GET /api/device/[id]/config
// route loads defaults and renders the brightness/timezone form.
// This specifically covers the Next.js 15 upgrade surface: the Pages Router API handler
// uses the `return res.json()` pattern which Next.js 15 warns about but must still work.
test('device settings tab: loads config and renders brightness/timezone fields', async ({
  page,
  seededDevice,
}) => {
  await page.goto(`/device/${seededDevice.id}`)
  await page.waitForLoadState('networkidle')

  // Click the Settings tab
  await page.getByRole('tab', { name: 'Settings' }).click()

  // Brightness slider must be visible and within range
  const brightnessSlider = page.locator('#brightness')
  await expect(brightnessSlider).toBeVisible({ timeout: 10_000 })
  const brightnessValue = await brightnessSlider.inputValue()
  expect(Number(brightnessValue)).toBeGreaterThanOrEqual(1)
  expect(Number(brightnessValue)).toBeLessThanOrEqual(100)

  // Timezone field must be visible and contain a non-empty value
  const timezoneInput = page.locator('#timezone')
  await expect(timezoneInput).toBeVisible()
  const tzValue = await timezoneInput.inputValue()
  expect(tzValue.length).toBeGreaterThan(0)

  // Save and Discard buttons are rendered (disabled when not dirty)
  const saveBtn = page.getByRole('button', { name: /^save$/i })
  await expect(saveBtn).toBeVisible()
  await expect(saveBtn).toBeDisabled()
  const discardBtn = page.getByRole('button', { name: /discard/i })
  await expect(discardBtn).toBeDisabled()

  // Mutate brightness and verify the form becomes dirty
  await brightnessSlider.evaluate((el: HTMLInputElement) => {
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      'value'
    )!.set
    nativeInputValueSetter!.call(el, String(Number(el.value) < 80 ? 81 : 50))
    el.dispatchEvent(new Event('input', { bubbles: true }))
    el.dispatchEvent(new Event('change', { bubbles: true }))
  })
  await expect(saveBtn).toBeEnabled({ timeout: 5_000 })
  await expect(discardBtn).toBeEnabled()

  // Discard restores the clean state
  await discardBtn.click()
  await expect(saveBtn).toBeDisabled({ timeout: 5_000 })
})

test('device settings tab: save settings round-trip persists to API', async ({
  page,
  seededDevice,
}) => {
  await page.goto(`/device/${seededDevice.id}`)
  await page.waitForLoadState('networkidle')

  await page.getByRole('tab', { name: 'Settings' }).click()

  const timezoneInput = page.locator('#timezone')
  await expect(timezoneInput).toBeVisible({ timeout: 10_000 })

  const originalTz = await timezoneInput.inputValue()

  // Change timezone to a different IANA value
  const newTz = originalTz === 'America/Los_Angeles' ? 'America/New_York' : 'America/Los_Angeles'
  await timezoneInput.fill(newTz)

  const saveBtn = page.getByRole('button', { name: /^save$/i })
  await expect(saveBtn).toBeEnabled({ timeout: 5_000 })
  await saveBtn.click()

  // Verify success message
  await expect(page.getByText('Settings saved.')).toBeVisible({ timeout: 10_000 })

  // Reload and verify the value persisted (proves the PUT /api/device/[id]/config round-trip)
  await page.reload()
  await page.waitForLoadState('networkidle')
  await page.getByRole('tab', { name: 'Settings' }).click()

  const tzAfterReload = await page.locator('#timezone').inputValue()
  expect(tzAfterReload).toBe(newTz)

  // Restore original value to avoid polluting device state
  await page.locator('#timezone').fill(originalTz)
  await page.getByRole('button', { name: /^save$/i }).click()
  await expect(page.getByText('Settings saved.')).toBeVisible({ timeout: 10_000 })
})
