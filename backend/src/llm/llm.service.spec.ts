import { BadGatewayException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { ClaimType } from '../generated/prisma/enums';
import { LlmService } from './llm.service';
import { PROMPT_VERSION } from './prompt';

jest.mock('openai');

const input = {
  productName: 'Revitalift Night Cream',
  claimType: ClaimType.EFFICACY,
  claimText: 'Reduces wrinkles by 20% in 4 weeks',
  evidence: '4-week study, 100 women, 18% reduction vs 3% placebo, p < 0.05.',
};

const allChecks = ['RIGHT_PROOF', 'ENDPOINT', 'MAGNITUDE', 'DURATION', 'RELIABILITY'].map((name) => ({
  name,
  applicable: true,
  met: name !== 'MAGNITUDE',
  detail: `${name} detail`,
}));

function configWith(values: Record<string, string | undefined>) {
  return {
    get: jest.fn((key: string) => values[key]),
    getOrThrow: jest.fn((key: string) => {
      if (!values[key]) throw new Error(`${key} missing`);
      return values[key];
    }),
  } as unknown as ConfigService;
}

describe('LlmService', () => {
  const OpenAIMock = OpenAI as unknown as jest.Mock;
  let parse: jest.Mock;

  // The service logs failures on purpose; keep test output clean.
  beforeAll(() => jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined));
  afterAll(() => jest.restoreAllMocks());

  beforeEach(() => {
    parse = jest.fn();
    OpenAIMock.mockImplementation(() => ({ chat: { completions: { parse } } }));
  });
  afterEach(() => jest.clearAllMocks());


  const createService = (overrides: Record<string, string | undefined> = {}) =>
    new LlmService(
      configWith({
        OPENAI_API_KEY: 'test-key',
        OPENAI_BASE_URL: 'https://example.test/v1/',
        OPENAI_MODEL: 'gemini-3.6-flash',
        ...overrides,
      }),
    );
  const replyWith = (parsed: unknown) => parse.mockResolvedValue({ choices: [{ message: { parsed } }] });

  it('creates the OpenAI client from config with a timeout and one retry', () => {
    createService();
    expect(OpenAIMock).toHaveBeenCalledWith({
      apiKey: 'test-key',
      baseURL: 'https://example.test/v1/',
      timeout: 30_000,
      maxRetries: 1,
    });
  });

  it('uses the default OpenAI endpoint when no base URL is set', () => {
    createService({ OPENAI_BASE_URL: '' });
    expect(OpenAIMock).toHaveBeenCalledWith(expect.objectContaining({ baseURL: undefined }));
  });

  it('fails fast at startup when the API key is missing', () => {
    expect(() => createService({ OPENAI_API_KEY: undefined })).toThrow('OPENAI_API_KEY missing');
  });

  it('sends the system and user prompts with a JSON schema response format', async () => {
    replyWith({ checks: allChecks, reasoning: 'ok' });
    await createService().assess(input);

    const body = parse.mock.calls[0][0];
    expect(body.model).toBe('gemini-3.6-flash');
    expect(body.messages.map((m: { role: string }) => m.role)).toEqual(['system', 'user']);
    expect(body.messages[1].content).toContain(input.claimText);
    expect(body.response_format.type).toBe('json_schema');
  });

  it('returns the validated assessment with the model and prompt version', async () => {
    replyWith({ checks: allChecks, reasoning: 'Falls short of 20%.' });

    await expect(createService().assess(input)).resolves.toEqual({
      assessment: { checks: allChecks, reasoning: 'Falls short of 20%.' },
      model: 'gemini-3.6-flash',
      promptVersion: PROMPT_VERSION,
    });
  });

  it('returns 502 when the AI call fails', async () => {
    parse.mockRejectedValue(new Error('503 model overloaded'));
    await expect(createService().assess(input)).rejects.toThrow(
      new BadGatewayException('AI service is unavailable right now. Please try again.'),
    );
  });

  it('returns 502 when the AI reply does not match the schema', async () => {
    replyWith({ checks: 'not-a-list' });
    await expect(createService().assess(input)).rejects.toThrow('AI returned an invalid response');
  });

  it('returns 502 when a check is missing', async () => {
    replyWith({ checks: allChecks.slice(0, 4), reasoning: 'ok' });
    await expect(createService().assess(input)).rejects.toThrow('AI returned an invalid response');
  });

  it('returns 502 when a check is repeated instead of answered', async () => {
    replyWith({ checks: [...allChecks.slice(0, 4), allChecks[0]], reasoning: 'ok' });
    await expect(createService().assess(input)).rejects.toThrow('AI returned an invalid response');
  });

  it('returns 502 when the AI returns no parsed content', async () => {
    replyWith(null);
    await expect(createService().assess(input)).rejects.toThrow('AI returned an invalid response');
  });
});
