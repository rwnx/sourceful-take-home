-- CreateEnum
CREATE TYPE "ImageStatus" AS ENUM ('PENDING', 'SUCCESS', 'ERROR');

-- CreateTable
CREATE TABLE "Image" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "status" "ImageStatus" NOT NULL DEFAULT 'PENDING',
    "groupId" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "result" TEXT,
    "error" TEXT,

    CONSTRAINT "Image_pkey" PRIMARY KEY ("id")
);
