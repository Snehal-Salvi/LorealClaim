import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { claim, justifiedWithNa, notJustified } from '../test/fixtures.js';
import ResultCard from './ResultCard.jsx';

describe('ResultCard', () => {
  it('shows "Not justified", the confidence and the reasoning', () => {
    render(<ResultCard claim={claim} assessment={notJustified} />);

    expect(screen.getByText('Not justified')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Confidence 80 percent' })).toBeInTheDocument();
    expect(screen.getByText('4 of 5 checks passed')).toBeInTheDocument();
    expect(screen.getByText(notJustified.reasoning)).toBeInTheDocument();
  });

  it('shows the claim being assessed', () => {
    render(<ResultCard claim={claim} assessment={notJustified} />);
    expect(screen.getByText(`“${claim.claimText}”`)).toBeInTheDocument();
    expect(screen.getByText(/Revitalift Night Cream, efficacy claim/)).toBeInTheDocument();
  });

  it('lists every check with pass / fail and its detail', () => {
    render(<ResultCard claim={claim} assessment={notJustified} />);

    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(5);
    const howMuch = items.find((li) => within(li).queryByText('How much'));
    expect(howMuch).toHaveClass('fail');
    expect(within(howMuch).getByLabelText('Failed')).toBeInTheDocument();
    expect(within(howMuch).getByText('18% vs 20% claimed.')).toBeInTheDocument();
    expect(screen.getAllByLabelText('Passed')).toHaveLength(4);
  });

  it('shows "Justified" and marks checks that do not apply', () => {
    render(<ResultCard claim={claim} assessment={justifiedWithNa} />);

    expect(screen.getByText('Justified')).toBeInTheDocument();
    expect(screen.getByText('4 of 4 checks passed (1 not applicable)')).toBeInTheDocument();
    expect(screen.getByLabelText('Not applicable')).toBeInTheDocument();
  });

  it('shows which model and prompt version produced the result', () => {
    render(<ResultCard claim={claim} assessment={notJustified} />);
    expect(screen.getByText(/gemini-3\.6-flash, prompt v1/)).toBeInTheDocument();
    expect(screen.getByText(/final decision rests with the evaluator/)).toBeInTheDocument();
  });
});
