import { verifySignatureAppRouter } from '@upstash/qstash/nextjs'
import { put } from '@vercel/blob';
import { NextResponse } from 'next/server'
import prisma from '@/app/lib/prisma'
import { getImageGenerationProvider, ProviderFileType, ProviderNameSchema } from '@/app/lib/providers'
import { parseQStashCallbackPayload } from '@/app/lib/queue/qstash/callback'

/** This response sends the message to the DLQ
 * See https://upstash.com/docs/qstash/features/retry
 */
const NotRetryableResponse = (id: string) => NextResponse.json({ ok: false, id }, {status: 489, headers: {"Upstash-NonRetryable-Error": "true"}})

const extensions: Record<ProviderFileType, string> = {
  [ProviderFileType.JPEG]: "jpg"
}
const dataUrlPrefix: Record<ProviderFileType, string> = {
  [ProviderFileType.JPEG]: "data:image/jpeg;base64,"
}
const getFileExtension = (filetype: ProviderFileType) => {
  return extensions[filetype]
}
const getDataUrl = (filetype: ProviderFileType, data: string) => dataUrlPrefix[filetype] + data

async function handler(req: Request, ctx: RouteContext<'/api/worker/[providerId]/[id]'>) {
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

  const callbackBody = provider.parseCallbackBody(upstreamBody)
  if (callbackBody.error !== undefined) {
    console.error(`[/api/worker/${provider.name}/${id}] INVALID PROVIDER BODY`)

    await prisma.image.update({
      where: { id },
      data: { status: 'ERROR', error: callbackBody.error },
    })
    return NotRetryableResponse(id)
  }

  const extension = getFileExtension(callbackBody.filetype)
  const putResult = await put(`images/${id}.${extension}`, Buffer.from(callbackBody.data, "base64"), {access: "public"})
  const url = putResult.url;

  await prisma.image.update({
    where: { id },
    data: { status: 'SUCCESS', result: url },
  })
  console.info(`[/api/worker/${provider.name}/${id}] SUCCESS`)

  return NextResponse.json({ ok: true, id })
}

export const POST = verifySignatureAppRouter(handler)