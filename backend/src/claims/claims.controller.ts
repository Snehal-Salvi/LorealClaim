import { Body, Controller, Get, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ClaimsService } from './claims.service';
import { AssessClaimDto } from './dto/assess-claim.dto';

@Controller('claims')
export class ClaimsController {
  constructor(private readonly claims: ClaimsService) {}

  // POST /api/claims/assess: save the claim, ask the AI, save and return the assessment.
  @Post('assess')
  assess(@Body() dto: AssessClaimDto) {
    return this.claims.assess(dto);
  }

  // GET /api/claims/:id: the claim and all its assessments (audit history).
  @Get(':id')
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.claims.findOne(id);
  }
}
