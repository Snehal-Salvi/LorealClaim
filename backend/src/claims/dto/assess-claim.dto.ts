import { Transform } from 'class-transformer';
import { IsEnum, IsString, Length } from 'class-validator';
import { ClaimType } from '../../generated/prisma/enums';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

// Request body for POST /api/claims/assess
export class AssessClaimDto {
  @Transform(trim)
  @IsString()
  @Length(2, 200)
  productName: string;

  @IsEnum(ClaimType, { message: `claimType must be one of: ${Object.values(ClaimType).join(', ')}` })
  claimType: ClaimType;

  @Transform(trim)
  @IsString()
  @Length(5, 500)
  claimText: string;

  @Transform(trim)
  @IsString()
  @Length(50, 10_000, { message: 'evidence must be between 50 and 10,000 characters. Please paste the study results' })
  evidence: string;
}
