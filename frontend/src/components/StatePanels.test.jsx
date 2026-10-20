import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ApiError } from '../api.js';
import { ErrorPanel, IdlePanel, LoadingPanel } from './StatePanels.jsx';

describe('IdlePanel', () => {
  it('explains the five checks', () => {
    render(<IdlePanel />);
    for (const label of ['Right type of proof', 'What was measured', 'How much', 'How long', 'How reliable']) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });
});

describe('LoadingPanel', () => {
  it('shows the claim being assessed as a status message', () => {
    render(<LoadingPanel claimText="Absorbs in 30 seconds" />);
    expect(screen.getByRole('status')).toHaveTextContent('Reading the study');
    expect(screen.getByText('“Absorbs in 30 seconds”')).toBeInTheDocument();
  });
});

describe('ErrorPanel', () => {
  it('explains that the AI was unavailable and the claim was saved, with a working retry', async () => {
    const onRetry = vi.fn();
    render(<ErrorPanel error={new ApiError('unavailable', 'AI busy')} onRetry={onRetry} />);

    expect(screen.getByRole('alert')).toHaveTextContent('The AI service didn’t answer');
    expect(screen.getByText(/Your claim has been saved/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('shows the field messages for validation errors, without a retry button', () => {
    render(<ErrorPanel error={new ApiError('validation', 'evidence is too short')} onRetry={vi.fn()} />);
    expect(screen.getByText('Some details need attention')).toBeInTheDocument();
    expect(screen.getByText('evidence is too short')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Try again' })).not.toBeInTheDocument();
  });

  it('tells the user to check the backend when it is offline', () => {
    render(<ErrorPanel error={new ApiError('offline', 'no server')} onRetry={vi.fn()} />);
    expect(screen.getByText('LorealClaim server not reachable')).toBeInTheDocument();
  });
});
