import { requireAuthContext } from "@/app/lib/auth"
import prisma from "@/app/lib/prisma"
import { GenerationsGetLatestResponse } from "@/app/lib/schema/api"
import { NextRequest, NextResponse } from "next/server"
import dayjs, { Dayjs } from "dayjs"

export async function GET(req: NextRequest): Promise<NextResponse<GenerationsGetLatestResponse>> {
  requireAuthContext(req)

  const [lastUpdatedImage, lastCreatedImage] = await Promise.all([
    prisma.image.findFirst({ orderBy: [{ updatedAt: "desc" }] }),
    prisma.image.findFirst({ orderBy: [{ createdAt: "desc" }] }),
  ]) 

  const lastUpdated = dayjs(lastUpdatedImage?.updatedAt)
  const lastCreated = dayjs(lastCreatedImage?.createdAt)
  let latest: Dayjs;
  if(lastUpdated.isAfter(lastCreated)) {
    latest = lastUpdated
  } else {
    latest = lastCreated
  }
  
  return NextResponse.json({
    data: latest.toDate()
  })
}

