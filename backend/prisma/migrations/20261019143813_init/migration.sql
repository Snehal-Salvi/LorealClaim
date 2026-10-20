-- CreateEnum
CREATE TYPE "ClaimType" AS ENUM ('EFFICACY', 'CONSUMER_PERCEPTION', 'SENSORY', 'SAFETY');

-- CreateEnum
CREATE TYPE "ClaimStatus" AS ENUM ('PROPOSED', 'APPROVED', 'REJECTED', 'IN_TESTING', 'EVIDENCE_SUBMITTED', 'ASSESSED', 'VALIDATED');

-- CreateTable
CREATE TABLE "claims" (
    "id" UUID NOT NULL,
    "productName" TEXT NOT NULL,
    "claimType" "ClaimType" NOT NULL,
    "claimText" TEXT NOT NULL,
    "status" "ClaimStatus" NOT NULL DEFAULT 'PROPOSED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "claims_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assessments" (
    "id" UUID NOT NULL,
    "claimId" UUID NOT NULL,
    "evidence" TEXT NOT NULL,
    "justified" BOOLEAN NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "reasoning" TEXT NOT NULL,
    "criteria" JSONB NOT NULL,
    "model" TEXT NOT NULL,
    "promptVersion" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assessments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "assessments_claimId_idx" ON "assessments"("claimId");

-- AddForeignKey
ALTER TABLE "assessments" ADD CONSTRAINT "assessments_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "claims"("id") ON DELETE CASCADE ON UPDATE CASCADE;
