import { verifySignatureAppRouter } from '@upstash/qstash/nextjs'
import { NextResponse } from 'next/server'
import prisma from '@/app/lib/prisma'
import { getImageGenerationProvider, ProviderNameSchema } from '@/app/lib/providers'
import { parseQStashCallbackPayload } from '@/app/lib/queue/qstash/callback'

/** This response sends the message to the DLQ
 * See https://upstash.com/docs/qstash/features/retry
 */
const NotRetryableResponse = (id: string) => NextResponse.json({ ok: false, id }, {status: 489, headers: {"Upstash-NonRetryable-Error": "true"}})

export async function POST(req: Request, ctx: RouteContext<'/api/worker/[providerId]/[id]'>) {
  const { id, providerId } = await ctx.params
  if (!id) {
    throw new Error("missing id")
  }

  const parsedProvider = ProviderNameSchema.safeParse(providerId)
  if (!parsedProvider.success) {
    console.error(`[/api/worker/${parsedProvider}/${id}] UNKNOWN PROVIDER`)
    return NotRetryableResponse(id)
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
    return NotRetryableResponse(id)
  }

  const upstreamBody = callback.upstreamBody
  const failed = new URL(req.url).searchParams.get('failed') === 'true'

  if (failed || callback.status < 200 || callback.status >= 300) {
    console.error(`[/api/worker/${provider.name}/${id}] UPSTREAM FAILED: ${callback.status} ${callback.upstreamBody}`)

    await prisma.image.update({
      where: { id },
      data: { status: 'ERROR', error: `${provider.name.toUpperCase()}: ${callback.status}: ${upstreamBody}` },
    })
    return NotRetryableResponse(id)
  }

  const parsedResult = provider.parseQStashCallbackBody(upstreamBody)
  if (!parsedResult.ok) {
    console.error(`[/api/worker/${provider.name}/${id}] INVALID PROVIDER BODY`)

    await prisma.image.update({
      where: { id },
      data: { status: 'ERROR', error: parsedResult.error },
    })
    return NotRetryableResponse(id)
  }

  await prisma.image.update({
    where: { id },
    data: { status: 'SUCCESS', result: parsedResult.result },
  })
  console.error(`[/api/worker/${provider.name}/${id}] SUCCESS`)

  return NextResponse.json({ ok: true, id })
}