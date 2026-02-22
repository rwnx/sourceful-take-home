
import "server-only"
import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid';
import client from "@/app/lib/qstash"
import prisma from '@/app/lib/prisma'
import { getFilledArray } from '@/app/lib/utils';
import { GenerationsIndexResponse, GenerationsIndexQuerySchema, GenerationsCreateResponse, GenerationsCreateInputSchema } from './schema';
import { requireUserId } from "@/app/lib/auth";
import { ProcessImageInput } from "../worker/images/schema";
import qs from "qs"
import { ZodObject } from "zod";

const parseQueryParams = <T extends ZodObject>(req: NextRequest, schema: T) => {
  const params = qs.parse(req.nextUrl.search, { ignoreQueryPrefix: true });
  return schema.parse(params)
}

export async function GET(req: NextRequest): Promise<NextResponse<GenerationsIndexResponse>> {
  // TODO: middleware?
  await requireUserId(req)
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

export async function POST(req: NextRequest): Promise<NextResponse<GenerationsCreateResponse>> {
  const userId = await requireUserId(req) // 401
  const { numImages, animal } = GenerationsCreateInputSchema.parse(await req.json()) // 400
  const groupId = uuidv4()

  const prompt = `A silly ${animal}`;

  console.debug(`[generations] ${groupId} creating ${numImages} images}`)
  const created = await prisma.image.createManyAndReturn({
    data: getFilledArray(numImages, {
      userId,
      prompt,
      groupId
    })
  })


  console.debug(`[generations] ${groupId} creating ${numImages} messages}`)
  const messages = await client.batchJSON<ProcessImageInput>(created.map((image) => ({
    url: `${process.env.NEXT_PUBLIC_URL}/api/worker/images`,
    body: {
      jobId: image.id,
      prompt,
      groupId,
    }
  })))

  return NextResponse.json(created.map(x => ({
    jobId: x.id,
    groupId,
    status: x.status,
  })))
}