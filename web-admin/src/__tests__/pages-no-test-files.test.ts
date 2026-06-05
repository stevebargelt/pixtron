/**
 * Regression guard: no *.test.ts / *.test.tsx / *.spec.ts / *.spec.tsx files
 * may exist anywhere under src/pages/.
 *
 * Next.js Pages Router compiles EVERY file under src/pages/ into a production
 * route, so a test file like src/pages/api/foo.test.ts becomes the live
 * endpoint /api/foo.test — exposing internals and bloating the bundle.
 * Tests must live under src/__tests__/ instead.
 */

import fs from 'fs'
import path from 'path'

function findTestFiles(dir: string): string[] {
  const results: string[] = []

  if (!fs.existsSync(dir)) return results

  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      results.push(...findTestFiles(fullPath))
    } else if (/\.(test|spec)\.(ts|tsx)$/.test(entry.name)) {
      results.push(fullPath)
    }
  }

  return results
}

describe('src/pages/ must not contain test or spec files', () => {
  it('has no *.test.ts / *.test.tsx / *.spec.ts / *.spec.tsx files under src/pages/', () => {
    const pagesDir = path.join(process.cwd(), 'src', 'pages')
    const testFiles = findTestFiles(pagesDir)

    const relativeFiles = testFiles.map(f => path.relative(process.cwd(), f))

    if (testFiles.length > 0) {
      throw new Error(
        `Found test/spec files inside src/pages/ — Next.js Pages Router turns every file\n` +
          `under src/pages/ into a production route, so these leak as live endpoints:\n\n` +
          `  ${relativeFiles.join('\n  ')}\n\n` +
          `Move them to src/__tests__/ instead.`
      )
    }
    expect(testFiles).toEqual([])
  })
})
