import { describe, it } from 'node:test'
import * as assert from 'node:assert'

// ---- Import from implementation ----
import {
  selectLatestFeaturedRepo,
  renderFlightRecorder,
  replaceFlightRecorder,
  updateFlightRecorder,
  FEATURED_REPOS,
} from './update-flight-recorder.mjs'

// ---- Fixtures ----

const makeRepo = (overrides) => ({
  name: 'some-repo',
  full_name: 'shakhbozmn/some-repo',
  pushed_at: '2026-07-10T00:00:00Z',
  fork: false,
  archived: false,
  language: 'TypeScript',
  html_url: 'https://github.com/shakhbozmn/some-repo',
  ...overrides,
})

// ---- Tests ----

describe('FEATURED_REPOS', () => {
  it('is a Set with four known repo names', () => {
    assert.ok(FEATURED_REPOS instanceof Set)
    assert.strictEqual(FEATURED_REPOS.size, 4)
    assert.ok(FEATURED_REPOS.has('feathers-board'))
    assert.ok(FEATURED_REPOS.has('4work'))
    assert.ok(FEATURED_REPOS.has('scrap-fortress'))
    assert.ok(FEATURED_REPOS.has('widly'))
  })
})

describe('selectLatestFeaturedRepo', () => {
  it('ignores forks', () => {
    const repos = [
      makeRepo({ name: 'feathers-board', pushed_at: '2026-07-18T00:00:00Z', fork: true }),
      makeRepo({ name: '4work', pushed_at: '2026-07-19T00:00:00Z', fork: false }),
    ]
    const result = selectLatestFeaturedRepo(repos)
    assert.strictEqual(result.name, '4work')
  })

  it('ignores archived repositories', () => {
    const repos = [
      makeRepo({ name: 'feathers-board', pushed_at: '2026-07-20T00:00:00Z', archived: true }),
      makeRepo({ name: 'widly', pushed_at: '2026-07-19T00:00:00Z', archived: false }),
    ]
    const result = selectLatestFeaturedRepo(repos)
    assert.strictEqual(result.name, 'widly')
  })

  it('ignores repositories not in FEATURED_REPOS', () => {
    const repos = [
      makeRepo({ name: 'not-in-list', pushed_at: '2026-07-20T00:00:00Z' }),
      makeRepo({ name: 'feathers-board', pushed_at: '2026-07-18T00:00:00Z' }),
    ]
    const result = selectLatestFeaturedRepo(repos)
    assert.strictEqual(result.name, 'feathers-board')
  })

  it('selects the greatest pushed_at among valid repos', () => {
    const repos = [
      makeRepo({ name: 'scrap-fortress', pushed_at: '2026-07-15T00:00:00Z' }),
      makeRepo({ name: 'feathers-board', pushed_at: '2026-07-18T00:00:00Z' }),
      makeRepo({ name: 'widly', pushed_at: '2026-07-17T00:00:00Z' }),
    ]
    const result = selectLatestFeaturedRepo(repos)
    assert.strictEqual(result.name, 'feathers-board')
  })

  it('returns null when no valid repos exist', () => {
    const repos = [
      makeRepo({ name: 'feathers-board', fork: true }),
      makeRepo({ name: 'not-in-list', pushed_at: '2026-07-18T00:00:00Z' }),
    ]
    assert.strictEqual(selectLatestFeaturedRepo(repos), null)
  })
})

describe('renderFlightRecorder', () => {
  it('returns correct format with language', () => {
    const repo = makeRepo({
      name: 'feathers-board',
      pushed_at: '2026-07-18T00:00:00Z',
      language: 'TypeScript',
      html_url: 'https://github.com/shakhbozmn/feathers-board',
    })
    const result = renderFlightRecorder(repo)
    assert.strictEqual(
      result,
      '**Latest public transmission:** [feathers-board](https://github.com/shakhbozmn/feathers-board) · TypeScript · updated 2026-07-18'
    )
  })

  it('omits language cleanly when language is null', () => {
    const repo = makeRepo({
      name: 'widly',
      pushed_at: '2026-07-17T00:00:00Z',
      language: null,
      html_url: 'https://github.com/shakhbozmn/widly',
    })
    const result = renderFlightRecorder(repo)
    assert.strictEqual(
      result,
      '**Latest public transmission:** [widly](https://github.com/shakhbozmn/widly) · updated 2026-07-17'
    )
  })

  it('omits language cleanly when language is undefined', () => {
    const repo = makeRepo({
      name: 'widly',
      pushed_at: '2026-07-17T00:00:00Z',
      language: undefined,
      html_url: 'https://github.com/shakhbozmn/widly',
    })
    const result = renderFlightRecorder(repo)
    assert.ok(result.includes('· updated 2026-07-17'))
    assert.ok(!result.includes('· ·'))
  })
})

describe('replaceFlightRecorder', () => {
  const startMarker = '<!-- FLIGHT_RECORDER:START -->'
  const endMarker = '<!-- FLIGHT_RECORDER:END -->'

  it('changes only the content between the markers', () => {
    const readme = [
      '# Title',
      '',
      startMarker,
      'old content',
      endMarker,
      '',
      '## Other section',
    ].join('\n')

    const generated = 'new content'
    const result = replaceFlightRecorder(readme, generated)

    assert.ok(result.includes('# Title'))
    assert.ok(result.includes('## Other section'))
    assert.ok(result.includes(startMarker))
    assert.ok(result.includes(endMarker))
    assert.ok(!result.includes('old content'))
    assert.ok(result.includes('new content'))
  })

  it('throws descriptive error when start marker is missing', () => {
    const readme = '# Title\n<!-- FLIGHT_RECORDER:END -->\ncontent'
    assert.throws(
      () => replaceFlightRecorder(readme, 'new'),
      /start.*marker|FLIGHT_RECORDER:START/i
    )
  })

  it('throws descriptive error when end marker is missing', () => {
    const readme = '# Title\n<!-- FLIGHT_RECORDER:START -->\ncontent'
    assert.throws(
      () => replaceFlightRecorder(readme, 'new'),
      /end.*marker|FLIGHT_RECORDER:END/i
    )
  })

  it('throws descriptive error when markers are reversed', () => {
    const readme = [
      '<!-- FLIGHT_RECORDER:END -->',
      'content',
      '<!-- FLIGHT_RECORDER:START -->',
    ].join('\n')
    assert.throws(
      () => replaceFlightRecorder(readme, 'new'),
      /start.*marker|FLIGHT_RECORDER:START/i
    )
  })

  it('throws descriptive error when start marker is duplicated', () => {
    const readme = [
      startMarker,
      'content',
      startMarker,
      'content',
      endMarker,
    ].join('\n')
    assert.throws(
      () => replaceFlightRecorder(readme, 'new'),
      /duplicate|FLIGHT_RECORDER:START/i
    )
  })

  it('throws descriptive error when end marker is duplicated', () => {
    const readme = [
      startMarker,
      'content',
      endMarker,
      'more',
      endMarker,
    ].join('\n')
    assert.throws(
      () => replaceFlightRecorder(readme, 'new'),
      /duplicate|FLIGHT_RECORDER:END/i
    )
  })

  it('returns byte-identical README when content is already current', () => {
    const original = [
      '# My README',
      '',
      startMarker,
      '**Latest public transmission:** [feathers-board](https://github.com/shakhbozmn/feathers-board) · TypeScript · updated 2026-07-18',
      endMarker,
    ].join('\n')

    const generated = '**Latest public transmission:** [feathers-board](https://github.com/shakhbozmn/feathers-board) · TypeScript · updated 2026-07-18'
    const result = replaceFlightRecorder(original, generated)
    assert.strictEqual(result, original)
  })
})

describe('updateFlightRecorder — return value', () => {
  const makeDeps = (overrides = {}) => ({
    fetchImpl: async () => new Response('[]', { status: 200 }),
    readFileImpl: async () => '# README\n<!-- FLIGHT_RECORDER:START -->\nold\n<!-- FLIGHT_RECORDER:END -->',
    writeFileImpl: async () => {},
    readmePath: '/fake/readme.md',
    token: undefined,
    ...overrides,
  })

  it('returns "updated" when it writes', async () => {
    const deps = makeDeps({
      fetchImpl: async () => new Response(JSON.stringify([
        makeRepo({ name: 'feathers-board', pushed_at: '2026-07-18T00:00:00Z', language: 'TypeScript', html_url: 'https://github.com/shakhbozmn/feathers-board' }),
      ]), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
      readFileImpl: async () => [
        '# Title',
        '',
        '<!-- FLIGHT_RECORDER:START -->',
        '**Latest public transmission:** [widly](https://github.com/shakhbozmn/widly) · updated 2026-07-10',
        '<!-- FLIGHT_RECORDER:END -->',
      ].join('\n'),
    })
    const result = await updateFlightRecorder(deps)
    assert.strictEqual(result, 'updated')
  })

  it('returns "unchanged" when no allowlisted repository exists', async () => {
    const deps = makeDeps({
      fetchImpl: async () => new Response(JSON.stringify([
        { name: 'unknown-repo', pushed_at: '2026-07-18T00:00:00Z', fork: false, archived: false, language: 'JS', html_url: 'https://github.com/shakhbozmn/unknown-repo' },
      ]), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    })
    const result = await updateFlightRecorder(deps)
    assert.strictEqual(result, 'unchanged')
  })

  it('returns "unchanged" when generated content is unchanged', async () => {
    const readmeContent = [
      '# Title',
      '',
      '<!-- FLIGHT_RECORDER:START -->',
      '**Latest public transmission:** [feathers-board](https://github.com/shakhbozmn/feathers-board) · TypeScript · updated 2026-07-18',
      '<!-- FLIGHT_RECORDER:END -->',
    ].join('\n')
    const deps = makeDeps({
      fetchImpl: async () => new Response(JSON.stringify([
        makeRepo({ name: 'feathers-board', pushed_at: '2026-07-18T00:00:00Z', language: 'TypeScript', html_url: 'https://github.com/shakhbozmn/feathers-board' }),
      ]), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
      readFileImpl: async () => readmeContent,
    })
    const result = await updateFlightRecorder(deps)
    assert.strictEqual(result, 'unchanged')
  })
})

describe('updateFlightRecorder — error handling (no writes)', () => {
  const makeDeps = (overrides = {}) => ({
    fetchImpl: async () => new Response('[]', { status: 200 }),
    readFileImpl: async () => '# README\n<!-- FLIGHT_RECORDER:START -->\nold\n<!-- FLIGHT_RECORDER:END -->',
    writeFileImpl: async () => {},
    readmePath: '/fake/readme.md',
    token: undefined,
    ...overrides,
  })

  it('rejects with descriptive error when API response is non-ok', async () => {
    const deps = makeDeps({
      fetchImpl: async () => new Response('Forbidden', { status: 403 }),
    })
    await assert.rejects(
      updateFlightRecorder(deps),
      /GitHub API.*403|response.*not.*ok/i
    )
  })

  it('rejects with descriptive error when payload is not an array', async () => {
    const deps = makeDeps({
      fetchImpl: async () => new Response('{"error": true}', {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    })
    await assert.rejects(
      updateFlightRecorder(deps),
      /payload.*invalid|not.*array/i
    )
  })

  it('rejects with descriptive error when fetch throws (network error)', async () => {
    const deps = makeDeps({
      fetchImpl: async () => { throw new Error('ENOTFOUND') },
    })
    await assert.rejects(
      updateFlightRecorder(deps),
      /ENOTFOUND|fetch.*fail|network/i
    )
  })

  it('rejects with descriptive error when README is missing start marker', async () => {
    const deps = makeDeps({
      fetchImpl: async () => new Response(JSON.stringify([
        makeRepo({ name: 'feathers-board', pushed_at: '2026-07-18T00:00:00Z', language: 'TypeScript', html_url: 'https://github.com/shakhbozmn/feathers-board' }),
      ]), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
      readFileImpl: async () => '# README\n<!-- FLIGHT_RECORDER:END -->\ncontent',
    })
    await assert.rejects(
      updateFlightRecorder(deps),
      /FLIGHT_RECORDER:START/i
    )
  })

  it('rejects with descriptive error when README is missing end marker', async () => {
    const deps = makeDeps({
      fetchImpl: async () => new Response(JSON.stringify([
        makeRepo({ name: 'feathers-board', pushed_at: '2026-07-18T00:00:00Z', language: 'TypeScript', html_url: 'https://github.com/shakhbozmn/feathers-board' }),
      ]), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
      readFileImpl: async () => '# README\n<!-- FLIGHT_RECORDER:START -->\ncontent',
    })
    await assert.rejects(
      updateFlightRecorder(deps),
      /FLIGHT_RECORDER:END/i
    )
  })

  it('never calls writeFileImpl when rejecting due to error', async () => {
    let writeCalled = false
    const deps = makeDeps({
      fetchImpl: async () => { throw new Error('ENOTFOUND') },
      writeFileImpl: async () => { writeCalled = true },
    })
    await assert.rejects(updateFlightRecorder(deps), /ENOTFOUND/)
    assert.strictEqual(writeCalled, false)
  })
})

describe('updateFlightRecorder — write behavior', () => {
  const makeDeps = (overrides = {}) => ({
    fetchImpl: async () => new Response('[]', { status: 200 }),
    readFileImpl: async () => '# README\n<!-- FLIGHT_RECORDER:START -->\nold\n<!-- FLIGHT_RECORDER:END -->',
    writeFileImpl: async () => {},
    readmePath: '/fake/readme.md',
    token: undefined,
    ...overrides,
  })

  it('calls writeFileImpl once when valid content changes', async () => {
    let writeCallCount = 0
    let writtenContent = null
    const deps = makeDeps({
      fetchImpl: async () => new Response(JSON.stringify([
        makeRepo({ name: 'feathers-board', pushed_at: '2026-07-18T00:00:00Z', language: 'TypeScript', html_url: 'https://github.com/shakhbozmn/feathers-board' }),
      ]), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
      readFileImpl: async () => [
        '# Title',
        '',
        '<!-- FLIGHT_RECORDER:START -->',
        '**Latest public transmission:** [widly](https://github.com/shakhbozmn/widly) · TypeScript · updated 2026-07-10',
        '<!-- FLIGHT_RECORDER:END -->',
      ].join('\n'),
      writeFileImpl: async (path, content) => {
        writeCallCount++
        writtenContent = content
      },
    })
    const result = await updateFlightRecorder(deps)
    assert.strictEqual(result, 'updated')
    assert.strictEqual(writeCallCount, 1)
    assert.ok(writtenContent.includes('feathers-board'))
    assert.ok(!writtenContent.includes('widly'))
  })

  it('does not call writeFileImpl when generated content is unchanged', async () => {
    let writeCalled = false
    const readmeContent = [
      '# Title',
      '',
      '<!-- FLIGHT_RECORDER:START -->',
      '**Latest public transmission:** [feathers-board](https://github.com/shakhbozmn/feathers-board) · TypeScript · updated 2026-07-18',
      '<!-- FLIGHT_RECORDER:END -->',
    ].join('\n')
    const deps = makeDeps({
      fetchImpl: async () => new Response(JSON.stringify([
        makeRepo({ name: 'feathers-board', pushed_at: '2026-07-18T00:00:00Z', language: 'TypeScript', html_url: 'https://github.com/shakhbozmn/feathers-board' }),
      ]), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
      readFileImpl: async () => readmeContent,
      writeFileImpl: async () => { writeCalled = true },
    })
    const result = await updateFlightRecorder(deps)
    assert.strictEqual(result, 'unchanged')
    assert.strictEqual(writeCalled, false)
  })
})
