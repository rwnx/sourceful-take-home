
import "server-only"
import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid';
import client from "@/app/lib/queue/qstash/client"
import prisma from '@/app/lib/prisma'
import { getFilledArray } from '@/app/lib/utils';
import { GenerationsIndexResponse, GenerationsIndexQuerySchema, GenerationsCreateResponse, GenerationsCreateInputSchema } from '@/app/lib/schema/api';
import { requireAuthContext } from "@/app/lib/auth";
import qs from "qs"
import { ZodObject } from "zod";
import { getImageGenerationProvider } from "@/app/lib/providers";
import { route } from "@/app/lib/routing";


const parseQueryParams = <T extends ZodObject>(req: NextRequest, schema: T) => {
  const params = qs.parse(req.nextUrl.search, { ignoreQueryPrefix: true });
  return schema.parse(params)
}

export async function GET(req: NextRequest): Promise<NextResponse<GenerationsIndexResponse>> {
  requireAuthContext(req)
  const { offset, pageSize } = parseQueryParams(req, GenerationsIndexQuerySchema)

  const [total, page] = await Promise.all([
    prisma.image.count(),
    prisma.image.findMany({
      skip: offset,
      take: pageSize,
      orderBy: { createdAt: "desc" }
    })
  ])

  return NextResponse.json({
    meta: {
      offset,
      pageSize,
      total,
    },
    items: page.map(x => ({
      jobId: x.id,
      createdAt: x.createdAt,
      status: x.status,
      groupId: x.groupId,
      result: x.result ?? undefined,
      error: x.error ?? undefined
    }))
  })
}

const getPrompt = (animal: string) => `A silly ${animal}`


export async function POST(req: NextRequest): Promise<NextResponse<GenerationsCreateResponse>> {
  const { userId } = requireAuthContext(req)
  const { numImages, animal, provider } = GenerationsCreateInputSchema.parse(await req.json())
  const groupId = uuidv4()
  const providerAdapter = getImageGenerationProvider(provider)

  const prompt = getPrompt(animal)

  console.debug(`[/api/generations] ${groupId}: creating ${numImages}. provider: ${provider}`)

  const created = await prisma.image.createManyAndReturn({
    data: getFilledArray(numImages, { userId, prompt, groupId })
  })

  console.debug(`[/api/generations] ${groupId}: adding messages to queue...`)

  const messages = await client.batchJSON(created.map((image) => ({
    ...providerAdapter.getRequest({ prompt, jobId: image.id }),
    callback: route("/api/worker/[providerId]/[id]", {providerId: provider, id: image.id}),
    failureCallback: route("/api/worker/[providerId]/[id]", {providerId: provider, id: image.id}, {failed: true}),
  })))

  return NextResponse.json(created.map(x => ({
    jobId: x.id,
    groupId,
    createdAt: x.createdAt,
    status: x.status,
  })))
}
