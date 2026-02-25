import { verifySignatureAppRouter } from '@upstash/qstash/nextjs'
import { NextResponse } from 'next/server'
import prisma from '@/app/lib/prisma'
import { getImageGenerationProvider, ProviderNameSchema } from '@/app/lib/providers'
import { parseQStashCallbackPayload } from '@/app/lib/queue/qstash/callback'

const NotRetryable = (id: string) => NextResponse.json({ ok: false, id }, {status: 489, headers: {"Upstash-NonRetryable-Error": "true"}})

async function handler(req: Request, ctx: RouteContext<'/api/worker/[providerId]/[id]'>) {
  const { id, providerId } = await ctx.params
  if (!id) {
    throw new Error("missing id")
  }

  const parsedProvider = ProviderNameSchema.safeParse(providerId)
  if (!parsedProvider.success) {
    console.error(`[/api/worker/${parsedProvider}/${id}] UNKNOWN PROVIDER`)
    // send message to dlq - not compatible with this app but could contain important data for retry
    return NotRetryable(id)
  }

  const provider = getImageGenerationProvider(parsedProvider.data)

  const rawBody = await req.text()
  let callback: ReturnType<typeof parseQStashCallbackPayload>
  try {
    callback = parseQStashCallbackPayload(rawBody)
  } catch {
    console.error(`[/api/worker/${provider.name}/${id}] INVALID QSTASH PAYLOAD`)
    await prisma.image.update({
      where: { id },
      data: { status: 'ERROR', error: 'Malformed qstash callback payload' },
    })
    return NotRetryable(id)
  }

  const upstreamBody = callback.upstreamBody
  const failed = new URL(req.url).searchParams.get('failed') === 'true'

  if (failed || callback.status < 200 || callback.status >= 300) {
    console.error(`[/api/worker/${provider.name}/${id}] UPSTREAM FAILED: ${callback.status} ${callback.upstreamBody}`)

    await prisma.image.update({
      where: { id },
      data: { status: 'ERROR', error: `${provider.name.toUpperCase()}: ${callback.status}: ${upstreamBody}` },
    })
    return NotRetryable(id)
  }

  const parsedResult = provider.parseQStashCallbackBody(upstreamBody)
  if (!parsedResult.ok) {
    console.error(`[/api/worker/${provider.name}/${id}] INVALID PROVIDER BODY`)

    await prisma.image.update({
      where: { id },
      data: { status: 'ERROR', error: parsedResult.error },
    })
    return NotRetryable(id)
  }

  await prisma.image.update({
    where: { id },
    data: { status: 'SUCCESS', result: parsedResult.result },
  })
  console.error(`[/api/worker/${provider.name}/${id}] SUCCESS`)

  return NextResponse.json({ ok: true, id })
}

export const POST = verifySignatureAppRouter(handler)
