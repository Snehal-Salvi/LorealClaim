import { BadGatewayException, NotFoundException } from '@nestjs/common';
import { ClaimStatus, ClaimType } from '../generated/prisma/client';
import { Check } from '../llm/assessment.schema';
import { ClaimsService } from './claims.service';
import { AssessClaimDto } from './dto/assess-claim.dto';

const dto: AssessClaimDto = {
  productName: 'Revitalift Night Cream',
  claimType: ClaimType.EFFICACY,
  claimText: 'Reduces wrinkles by 20% in 4 weeks',
  evidence: '4-week double-blind study, 100 women, wrinkle depth by profilometry, 18% reduction vs 3% placebo, p < 0.05.',
};

const checks: Check[] = [
  { name: 'RIGHT_PROOF', applicable: true, met: true, detail: 'Instrumental measurement.' },
  { name: 'ENDPOINT', applicable: true, met: true, detail: 'Wrinkle depth measured.' },
  { name: 'MAGNITUDE', applicable: true, met: false, detail: '18% vs 20% claimed.' },
  { name: 'DURATION', applicable: true, met: true, detail: '4 weeks.' },
  { name: 'RELIABILITY', applicable: true, met: true, detail: 'n=100, placebo, p<0.05.' },
];

describe('ClaimsService', () => {
  const savedClaim = { id: 'claim-1', ...dto, status: ClaimStatus.EVIDENCE_SUBMITTED };

  let prisma: {
    claim: { create: jest.Mock; update: jest.Mock; findUnique: jest.Mock };
    assessment: { create: jest.Mock };
    $transaction: jest.Mock;
  };
  let llm: { assess: jest.Mock };
  let service: ClaimsService;

  beforeEach(() => {
    prisma = {
      claim: {
        create: jest.fn().mockResolvedValue(savedClaim),
        update: jest.fn((args) => ({ op: 'updateClaim', args })),
        findUnique: jest.fn(),
      },
      assessment: { create: jest.fn((args) => ({ op: 'createAssessment', args })) },
      $transaction: jest.fn(async (ops) => [{ id: 'assessment-1', ...ops[0].args.data }, { ...savedClaim, status: ClaimStatus.ASSESSED }]),
    };
    llm = {
      assess: jest.fn().mockResolvedValue({
        assessment: { checks, reasoning: 'Falls short of the 20% claimed.' },
        model: 'gemini-3.6-flash',
        promptVersion: 'v1',
      }),
    };
    service = new ClaimsService(prisma as never, llm as never);
  });

  describe('assess', () => {
    it('saves the claim first with status EVIDENCE_SUBMITTED', async () => {
      await service.assess(dto);

      expect(prisma.claim.create).toHaveBeenCalledWith({
        data: {
          productName: dto.productName,
          claimType: dto.claimType,
          claimText: dto.claimText,
          status: ClaimStatus.EVIDENCE_SUBMITTED,
        },
      });
      expect(prisma.claim.create.mock.invocationCallOrder[0]).toBeLessThan(llm.assess.mock.invocationCallOrder[0]);
    });

    it('sends the claim and evidence to the LLM', async () => {
      await service.assess(dto);
      expect(llm.assess).toHaveBeenCalledWith(dto);
    });

    it('saves the assessment with the verdict computed from the checks', async () => {
      await service.assess(dto);

      expect(prisma.assessment.create).toHaveBeenCalledWith({
        data: {
          claimId: 'claim-1',
          evidence: dto.evidence,
          justified: false,
          confidence: 0.8,
          reasoning: 'Falls short of the 20% claimed.',
          criteria: checks,
          model: 'gemini-3.6-flash',
          promptVersion: 'v1',
        },
      });
    });

    it('saves the assessment and moves the claim to ASSESSED in one transaction', async () => {
      await service.assess(dto);

      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      const [ops] = prisma.$transaction.mock.calls[0];
      expect(ops).toHaveLength(2);
      expect(prisma.claim.update).toHaveBeenCalledWith({ where: { id: 'claim-1' }, data: { status: ClaimStatus.ASSESSED } });
    });

    it('returns the updated claim and the saved assessment', async () => {
      const result = await service.assess(dto);

      expect(result.claim.status).toBe(ClaimStatus.ASSESSED);
      expect(result.assessment).toMatchObject({ id: 'assessment-1', justified: false, confidence: 0.8 });
    });

    it('keeps the claim but saves no assessment when the AI fails', async () => {
      llm.assess.mockRejectedValue(new BadGatewayException('AI service is unavailable right now. Please try again.'));

      await expect(service.assess(dto)).rejects.toBeInstanceOf(BadGatewayException);
      expect(prisma.claim.create).toHaveBeenCalled();
      expect(prisma.$transaction).not.toHaveBeenCalled();
      expect(prisma.assessment.create).not.toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('returns the claim with its assessments, newest first', async () => {
      prisma.claim.findUnique.mockResolvedValue({ ...savedClaim, assessments: [] });

      await expect(service.findOne('claim-1')).resolves.toMatchObject({ id: 'claim-1' });
      expect(prisma.claim.findUnique).toHaveBeenCalledWith({
        where: { id: 'claim-1' },
        include: { assessments: { orderBy: { createdAt: 'desc' } } },
      });
    });

    it('throws 404 when the claim does not exist', async () => {
      prisma.claim.findUnique.mockResolvedValue(null);
      await expect(service.findOne('missing')).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
