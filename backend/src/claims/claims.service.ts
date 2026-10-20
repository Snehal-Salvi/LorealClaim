import { Injectable, NotFoundException } from '@nestjs/common';
import { ClaimStatus, Prisma } from '../generated/prisma/client';
import { LlmService } from '../llm/llm.service';
import { PrismaService } from '../prisma/prisma.service';
import { AssessClaimDto } from './dto/assess-claim.dto';
import { computeVerdict } from './verdict';

@Injectable()
export class ClaimsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly llm: LlmService,
  ) {}

  async assess(dto: AssessClaimDto) {
    // 1. Save the claim first, so the submission is recorded even if the AI call fails.
    const claim = await this.prisma.claim.create({
      data: {
        productName: dto.productName,
        claimType: dto.claimType,
        claimText: dto.claimText,
        status: ClaimStatus.EVIDENCE_SUBMITTED,
      },
    });

    // 2. Ask the AI to answer each check (structured JSON, validated).
    const { assessment: ai, model, promptVersion } = await this.llm.assess({ ...dto });

    // 3. Our code works out the final result from the checks.
    const verdict = computeVerdict(ai.checks);

    // 4. Save the assessment and move the claim to ASSESSED in one transaction.
    const [assessment, updatedClaim] = await this.prisma.$transaction([
      this.prisma.assessment.create({
        data: {
          claimId: claim.id,
          evidence: dto.evidence,
          justified: verdict.justified,
          confidence: verdict.confidence,
          reasoning: ai.reasoning,
          criteria: ai.checks as unknown as Prisma.InputJsonValue,
          model,
          promptVersion,
        },
      }),
      this.prisma.claim.update({ where: { id: claim.id }, data: { status: ClaimStatus.ASSESSED } }),
    ]);

    return { claim: updatedClaim, assessment };
  }

  // A claim with its full assessment history (newest first).
  async findOne(id: string) {
    const claim = await this.prisma.claim.findUnique({
      where: { id },
      include: { assessments: { orderBy: { createdAt: 'desc' } } },
    });
    if (!claim) throw new NotFoundException(`Claim ${id} not found`);
    return claim;
  }
}
