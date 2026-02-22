import { Receiver } from '@upstash/qstash'
import { NextRequest, NextResponse } from 'next/server'
import dayjs from "dayjs"
import prisma from '@/app/lib/prisma'
import getImageProvider from './providers'
import { ProcessImageInputSchema } from './schema'

const imageProvider = getImageProvider("openai")

const receiver = new Receiver({
  currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY!,
  nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY!,
})



type InputIssue = {
  code: string
}

const UnauthorizedResponse = () => NextResponse.json({ message: "Unauthorized" }, { status: 401 })
const InvalidInputResponse = (issues: InputIssue[]) => NextResponse.json({ message: "Invalid Input", issues }, { status: 400 })


export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get('upstash-signature') ?? ''

  const isValid = await receiver.verify({ body, signature }).catch(() => false)
  if (!isValid) return UnauthorizedResponse()

  const parsed = ProcessImageInputSchema.safeParse(JSON.parse(body))

  if (!parsed.success) {
    console.error("Failed to parse input", parsed.error.issues)
    return InvalidInputResponse(parsed.error.issues)
  }
  const { jobId, prompt } = parsed.data

  const result = await imageProvider.image({ prompt })

  if (result.error) {
    console.error(`[worker/image] ${jobId} ERROR ${result.error}`)
    await prisma.image.update({
      where: { id: jobId }, data: {
        status: "ERROR", error: result.error
      }
    })
    return NextResponse.json({ ok: false, jobId })
  }

  console.log(`[worker/image] ${jobId} SUCCESS`)
  await prisma.image.update({
    where: { id: jobId }, data: {
      status: "SUCCESS", result: result.data
    }
  })

  return NextResponse.json({ ok: true, jobId })
}