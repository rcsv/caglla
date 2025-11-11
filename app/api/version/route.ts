import { NextResponse } from 'next/server'
import packageJson from '@/../package.json'

export const dynamic = 'force-static'

export async function GET() {
  const gitCommit = process.env.VERCEL_GIT_COMMIT_SHA || process.env.GIT_COMMIT_SHA || process.env.GIT_COMMIT || null
  const branch = process.env.VERCEL_GIT_COMMIT_REF || process.env.GIT_BRANCH || null

  return NextResponse.json({
    version: packageJson.version,
    gitCommit,
    branch,
    generatedAt: new Date().toISOString(),
  })
}
