import { BadGatewayException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { zodResponseFormat } from 'openai/helpers/zod';
import { ClaimType } from '../generated/prisma/enums';
import { CHECK_NAMES, LlmAssessment, LlmAssessmentSchema } from './assessment.schema';
import { PROMPT_VERSION, SYSTEM_PROMPT, buildUserPrompt } from './prompt';

export interface LlmResult {
  assessment: LlmAssessment;
  model: string;
  promptVersion: string;
}

// Talks to the LLM. Uses the official OpenAI SDK; OPENAI_BASE_URL lets us point it at
// any OpenAI-compatible provider (OpenAI, Azure OpenAI, Gemini) without code changes.
@Injectable()
export class LlmService {
  private readonly logger = new Logger(LlmService.name);
  private readonly client: OpenAI;
  private readonly model: string;

  constructor(config: ConfigService) {
    this.client = new OpenAI({
      apiKey: config.getOrThrow<string>('OPENAI_API_KEY'),
      baseURL: config.get<string>('OPENAI_BASE_URL') || undefined,
      timeout: 30_000, // fail fast instead of leaving the user waiting
      maxRetries: 1,
    });
    this.model = config.get<string>('OPENAI_MODEL') || 'gpt-5-mini';
  }

  async assess(input: { productName: string; claimType: ClaimType; claimText: string; evidence: string }): Promise<LlmResult> {
    let parsed: unknown;
    try {
      const completion = await this.client.chat.completions.parse({
        model: this.model,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: buildUserPrompt(input) },
        ],
        response_format: zodResponseFormat(LlmAssessmentSchema, 'claim_assessment'),
      });
      parsed = completion.choices[0]?.message?.parsed;
    } catch (error) {
      this.logger.error(`LLM call failed: ${(error as Error).message}`);
      throw new BadGatewayException('AI service is unavailable right now. Please try again.');
    }

    // Validate again ourselves; never trust the AI output blindly.
    const result = LlmAssessmentSchema.safeParse(parsed);
    if (!result.success || !this.hasEveryCheckOnce(result.data)) {
      this.logger.error(`LLM returned an invalid response: ${JSON.stringify(parsed)}`);
      throw new BadGatewayException('AI returned an invalid response. Please try again.');
    }

    return { assessment: result.data, model: this.model, promptVersion: PROMPT_VERSION };
  }

  private hasEveryCheckOnce(a: LlmAssessment): boolean {
    const names = a.checks.map((c) => c.name);
    return names.length === CHECK_NAMES.length && CHECK_NAMES.every((n) => names.includes(n));
  }
}
