import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { AssessClaimDto } from './assess-claim.dto';

const valid = {
  productName: 'Revitalift Night Cream',
  claimType: 'EFFICACY',
  claimText: 'Reduces wrinkles by 20% in 4 weeks',
  evidence: '4-week double-blind study, 100 women, wrinkle depth by profilometry, 18% reduction vs 3% placebo.',
};

// Same transform + validation the global ValidationPipe runs.
async function errorsFor(body: Record<string, unknown>) {
  const dto = plainToInstance(AssessClaimDto, body);
  const errors = await validate(dto);
  return { dto, fields: errors.map((e) => e.property) };
}

describe('AssessClaimDto', () => {
  it('accepts a valid request', async () => {
    const { fields } = await errorsFor(valid);
    expect(fields).toEqual([]);
  });

  it('trims whitespace from text fields', async () => {
    const { dto, fields } = await errorsFor({ ...valid, productName: '  Revitalift  ', claimText: '  Reduces wrinkles  ' });
    expect(fields).toEqual([]);
    expect(dto.productName).toBe('Revitalift');
    expect(dto.claimText).toBe('Reduces wrinkles');
  });

  it('rejects an unknown claim type', async () => {
    const { fields } = await errorsFor({ ...valid, claimType: 'MAGIC' });
    expect(fields).toEqual(['claimType']);
  });

  it('rejects evidence shorter than 50 characters', async () => {
    const { fields } = await errorsFor({ ...valid, evidence: 'too short' });
    expect(fields).toEqual(['evidence']);
  });

  it('counts evidence length after trimming', async () => {
    const { fields } = await errorsFor({ ...valid, evidence: `   ${'x'.repeat(40)}   ` });
    expect(fields).toEqual(['evidence']);
  });

  it('rejects evidence longer than 10,000 characters', async () => {
    const { fields } = await errorsFor({ ...valid, evidence: 'x'.repeat(10_001) });
    expect(fields).toEqual(['evidence']);
  });

  it('rejects a product name that is too short and a claim that is too short', async () => {
    const { fields } = await errorsFor({ ...valid, productName: 'X', claimText: 'hi' });
    expect(fields.sort()).toEqual(['claimText', 'productName']);
  });

  it('reports every missing field', async () => {
    const { fields } = await errorsFor({});
    expect(fields.sort()).toEqual(['claimText', 'claimType', 'evidence', 'productName']);
  });
});
