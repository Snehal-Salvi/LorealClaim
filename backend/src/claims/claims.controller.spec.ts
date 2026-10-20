import { ClaimType } from '../generated/prisma/client';
import { ClaimsController } from './claims.controller';
import { ClaimsService } from './claims.service';

describe('ClaimsController', () => {
  const service = { assess: jest.fn(), findOne: jest.fn() };
  const controller = new ClaimsController(service as unknown as ClaimsService);

  it('POST /claims/assess passes the body to the service and returns its result', async () => {
    const dto = { productName: 'P', claimType: ClaimType.SAFETY, claimText: 'Dermatologically tested', evidence: 'x'.repeat(60) };
    service.assess.mockResolvedValue({ claim: { id: '1' }, assessment: { id: 'a' } });

    await expect(controller.assess(dto)).resolves.toEqual({ claim: { id: '1' }, assessment: { id: 'a' } });
    expect(service.assess).toHaveBeenCalledWith(dto);
  });

  it('GET /claims/:id returns the claim with its history', async () => {
    service.findOne.mockResolvedValue({ id: '1', assessments: [] });
    await expect(controller.findOne('1')).resolves.toEqual({ id: '1', assessments: [] });
    expect(service.findOne).toHaveBeenCalledWith('1');
  });
});
