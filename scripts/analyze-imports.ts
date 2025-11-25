#!/usr/bin/env ts-node
import fs from 'fs/promises'
import path from 'path'

const projectRoot = path.resolve(__dirname, '..')
const defaultDir = '.'
const targetExtensions = new Set(['.ts', '.tsx', '.js', '.jsx'])
const ignoredDirs = new Set(['.git', '.next', '.turbo', 'dist', 'out', 'node_modules', 'coverage'])

function parseArgs() {
  const args = process.argv.slice(2)
  let dir = defaultDir
  let top = 30

  for (const arg of args) {
    if (arg.startsWith('--dir=')) {
      dir = arg.substring('--dir='.length)
    } else if (arg.startsWith('--top=')) {
      top = Number(arg.substring('--top='.length)) || top
    } else if (arg === '--all') {
      top = 0
    }
  }

  return {
    dir: path.resolve(projectRoot, dir),
    top,
  }
}

async function walk(dir: string, acc: string[] = []): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true })
  for (const entry of entries) {
    if (entry.name.startsWith('.')) {
      if (!['.env'].includes(entry.name) && ignoredDirs.has(entry.name)) continue
    }
    if (ignoredDirs.has(entry.name)) continue

    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      await walk(fullPath, acc)
    } else if (targetExtensions.has(path.extname(entry.name))) {
      acc.push(fullPath)
    }
  }
  return acc
}

function recordImports(source: string, counter: Map<string, number>) {
  const importRegex = /import\s+(?:[^'";]+?from\s+)?['"]([^'";]+)['"]/g
  const sideEffectRegex = /import\s*\(['"]([^'";]+)['"]\)/g
  const requireRegex = /require\(\s*['"]([^'";]+)['"]\s*\)/g

  for (const match of source.matchAll(importRegex)) {
    const specifier = match[1]
    counter.set(specifier, (counter.get(specifier) ?? 0) + 1)
  }
  for (const match of source.matchAll(sideEffectRegex)) {
    const specifier = match[1]
    counter.set(specifier, (counter.get(specifier) ?? 0) + 1)
  }
  for (const match of source.matchAll(requireRegex)) {
    const specifier = match[1]
    counter.set(specifier, (counter.get(specifier) ?? 0) + 1)
  }
}

async function main() {
  const { dir, top } = parseArgs()
  const counter = new Map<string, number>()

  const files = await walk(dir)
  await Promise.all(
    files.map(async file => {
      const content = await fs.readFile(file, 'utf8')
      recordImports(content, counter)
    })
  )

  const sorted = Array.from(counter.entries()).sort((a, b) => b[1] - a[1])
  const list = top > 0 ? sorted.slice(0, top) : sorted

  if (!list.length) {
    console.log('No imports found for given criteria.')
    return
  }

  const longestCount = Math.max(...list.map(([_, count]) => count.toString().length))
  for (const [specifier, count] of list) {
    console.log(`${count.toString().padStart(longestCount)}  ${specifier}`)
  }

  if (top > 0 && sorted.length > top) {
    console.log(`\nShowing top ${top} of ${sorted.length} unique specifiers. Use --all to show everything.`)
  }
}

main().catch(error => {
  console.error('Failed to analyze imports:', error)
  process.exit(1)
})
