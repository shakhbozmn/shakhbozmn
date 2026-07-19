import { readFile, writeFile } from 'node:fs/promises'

// ---- Public Interface ----

export const FEATURED_REPOS = new Set([
  'feathers-board',
  '4work',
  'scrap-fortress',
  'widly',
])

export function selectLatestFeaturedRepo(repositories) {
  let latest = null
  for (const repo of repositories) {
    if (repo.fork) continue
    if (repo.archived) continue
    if (!FEATURED_REPOS.has(repo.name)) continue
    if (!latest || repo.pushed_at > latest.pushed_at) {
      latest = repo
    }
  }
  return latest
}

export function renderFlightRecorder(repository) {
  const name = repository.name
  const url = repository.html_url
  const date = repository.pushed_at.slice(0, 10)
  if (repository.language) {
    return `**Latest public transmission:** [${name}](${url}) · ${repository.language} · updated ${date}`
  }
  return `**Latest public transmission:** [${name}](${url}) · updated ${date}`
}

export function replaceFlightRecorder(readme, generatedMarkdown) {
  const START = '<!-- FLIGHT_RECORDER:START -->'
  const END = '<!-- FLIGHT_RECORDER:END -->'

  const firstStart = readme.indexOf(START)
  const firstEnd = readme.indexOf(END)
  const lastStart = readme.lastIndexOf(START)
  const lastEnd = readme.lastIndexOf(END)

  if (firstStart === -1) {
    throw new Error('Missing start marker <!-- FLIGHT_RECORDER:START -->')
  }
  if (firstEnd === -1) {
    throw new Error('Missing end marker <!-- FLIGHT_RECORDER:END -->')
  }
  if (lastStart > firstEnd) {
    throw new Error('Markers are reversed: FLIGHT_RECORDER:START appears after FLIGHT_RECORDER:END')
  }
  if (firstStart !== lastStart) {
    throw new Error('Duplicate start marker <!-- FLIGHT_RECORDER:START -->')
  }
  if (firstEnd !== lastEnd) {
    throw new Error('Duplicate end marker <!-- FLIGHT_RECORDER:END -->')
  }

  const before = readme.slice(0, firstStart + START.length)
  const after = readme.slice(firstEnd)
  return before + '\n' + generatedMarkdown + '\n' + after
}

export async function updateFlightRecorder(dependencies = {}) {
  const {
    fetchImpl = globalThis.fetch,
    readFileImpl = readFile,
    writeFileImpl = writeFile,
    readmePath = new URL('../README.md', import.meta.url),
    token = process.env.GITHUB_TOKEN,
  } = dependencies

  // --- Fetch repos ---
  const headers = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  let response
  try {
    response = await fetchImpl(
      'https://api.github.com/users/shakhbozmn/repos?per_page=100&sort=pushed',
      { headers }
    )
  } catch (err) {
    throw new Error(`GitHub API fetch failed: ${err.message}`)
  }

  if (!response.ok) {
    throw new Error(`GitHub API response not ok: ${response.status} ${response.statusText}`)
  }

  let repos
  try {
    const json = await response.json()
    if (!Array.isArray(json)) {
      throw new Error('GitHub API payload is not an array')
    }
    repos = json
  } catch (err) {
    if (err.message.includes('not an array') || err.message.includes('Unexpected token')) {
      throw new Error(`Invalid GitHub API payload: ${err.message}`)
    }
    throw err
  }

  // --- Select latest featured repo ---
  const latest = selectLatestFeaturedRepo(repos)
  if (!latest) return 'unchanged'

  // --- Render content ---
  const generatedMarkdown = renderFlightRecorder(latest)

  // --- Read README ---
  const readme = await readFileImpl(readmePath, { encoding: 'utf-8' })

  // --- Replace (throws on malformed markers) ---
  const newReadme = replaceFlightRecorder(readme, generatedMarkdown)
  if (newReadme === readme) return 'unchanged'

  // --- Write back ---
  await writeFileImpl(readmePath, newReadme, { encoding: 'utf-8' })
  return 'updated'
}

// ---- Guard: run directly when executed as entry-point ----
const isMain = import.meta.url === `file://${process.argv[1]?.replace(/\\/g, '/')}`
if (isMain) {
  try {
    const result = await updateFlightRecorder()
    console.log(`Flight recorder ${result}`)
  } catch (err) {
    console.error('Flight recorder update failed:', err.message)
    process.exit(1)
  }
}
