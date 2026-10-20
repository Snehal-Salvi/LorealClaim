import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError, assessClaim } from '../api.js';
import { claim, notJustified } from '../test/fixtures.js';
import ClaimAssessment from './ClaimAssessment.jsx';

vi.mock('../api.js', async (importOriginal) => ({ ...(await importOriginal()), assessClaim: vi.fn() }));

const user = userEvent.setup();
const fields = () => ({
  product: screen.getByLabelText(/Product name/),
  claimType: screen.getByLabelText(/Claim type/),
  claim: screen.getByLabelText(/^Claim \*/),
  evidence: screen.getByLabelText(/Study results/),
  submit: screen.getByRole('button', { name: 'Assess claim' }),
  reset: screen.getByRole('button', { name: 'Reset' }),
});

describe('ClaimAssessment', () => {
  beforeEach(() => vi.mocked(assessClaim).mockReset());

  it('starts empty, with Assess and Reset disabled', () => {
    render(<ClaimAssessment />);
    const f = fields();
    expect(f.product).toHaveValue('');
    expect(f.claimType).toHaveValue('EFFICACY');
    expect(f.submit).toBeDisabled();
    expect(f.reset).toBeDisabled();
    expect(screen.getByText('Five questions, one verdict')).toBeInTheDocument();
  });

  it('fills every field from an example', async () => {
    render(<ClaimAssessment />);
    await user.click(screen.getByRole('button', { name: 'Absorption claim' }));

    const f = fields();
    expect(f.product).toHaveValue('Hydra Genius Serum');
    expect(f.claimType).toHaveValue('SENSORY');
    expect(f.claim).toHaveValue('Absorbs in 30 seconds');
    expect(f.submit).toBeEnabled();
  });

  it('keeps Assess disabled until the evidence has 50 characters', async () => {
    render(<ClaimAssessment />);
    const f = fields();
    await user.type(f.product, 'Serum');
    await user.type(f.claim, 'Absorbs fast');
    await user.type(f.evidence, 'too short');

    expect(f.submit).toBeDisabled();
    expect(screen.getByText('41 more characters needed')).toBeInTheDocument();

    await user.type(f.evidence, ', a 20-person sensory panel measured absorption.');
    expect(f.submit).toBeEnabled();
  });

  it('shows the hint for the selected claim type', async () => {
    render(<ClaimAssessment />);
    await user.selectOptions(fields().claimType, 'CONSUMER_PERCEPTION');
    expect(screen.getByText('Needs a consumer survey.')).toBeInTheDocument();
  });

  it('submits the form and shows the result', async () => {
    vi.mocked(assessClaim).mockResolvedValue({ claim, assessment: notJustified });
    render(<ClaimAssessment />);
    await user.click(screen.getByRole('button', { name: 'Wrinkle claim' }));
    await user.click(fields().submit);

    expect(assessClaim).toHaveBeenCalledWith({
      productName: 'Revitalift Night Cream',
      claimType: 'EFFICACY',
      claimText: 'Reduces wrinkles by 20% in 4 weeks',
      evidence: expect.stringContaining('18% average reduction'),
    });
    expect(await screen.findByText('Not justified')).toBeInTheDocument();
  });

  it('shows the loading state and locks the form while assessing', async () => {
    let finish;
    vi.mocked(assessClaim).mockReturnValue(new Promise((resolve) => (finish = resolve)));
    render(<ClaimAssessment />);
    await user.click(screen.getByRole('button', { name: 'Wrinkle claim' }));
    await user.click(fields().submit);

    expect(screen.getByRole('status')).toHaveTextContent('Reading the study');
    expect(screen.getByRole('button', { name: 'Assessing…' })).toBeDisabled();
    expect(screen.getByLabelText(/Product name/)).toBeDisabled();

    finish({ claim, assessment: notJustified });
    expect(await screen.findByText('Not justified')).toBeInTheDocument();
  });

  it('shows the AI-unavailable panel and retries with the same data', async () => {
    vi.mocked(assessClaim)
      .mockRejectedValueOnce(new ApiError('unavailable', 'AI busy'))
      .mockResolvedValueOnce({ claim, assessment: notJustified });
    render(<ClaimAssessment />);
    await user.click(screen.getByRole('button', { name: 'Wrinkle claim' }));
    await user.click(fields().submit);

    expect(await screen.findByText('The AI service didn’t answer')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Try again' }));

    expect(await screen.findByText('Not justified')).toBeInTheDocument();
    expect(assessClaim).toHaveBeenCalledTimes(2);
    expect(vi.mocked(assessClaim).mock.calls[1][0]).toEqual(vi.mocked(assessClaim).mock.calls[0][0]);
  });

  it('Reset clears the form and the result', async () => {
    vi.mocked(assessClaim).mockResolvedValue({ claim, assessment: notJustified });
    render(<ClaimAssessment />);
    await user.click(screen.getByRole('button', { name: 'Wrinkle claim' }));
    await user.click(fields().submit);
    await screen.findByText('Not justified');

    await user.click(fields().reset);

    const f = fields();
    expect(f.product).toHaveValue('');
    expect(f.claim).toHaveValue('');
    expect(f.evidence).toHaveValue('');
    expect(f.claimType).toHaveValue('EFFICACY');
    expect(screen.queryByText('Not justified')).not.toBeInTheDocument();
    expect(screen.getByText('Five questions, one verdict')).toBeInTheDocument();
    expect(f.reset).toBeDisabled();
  });
});
