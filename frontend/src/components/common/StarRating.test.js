import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import StarRating from './StarRating';

describe('StarRating', () => {
  it('renders 5 stars', () => {
    render(<StarRating />);
    const stars = screen.getAllByRole('button');
    expect(stars).toHaveLength(5);
  });

  it('calls onChange with the selected rating', async () => {
    const onChange = jest.fn();
    render(<StarRating onChange={onChange} />);
    const stars = screen.getAllByRole('button');
    await userEvent.click(stars[2]); // 3rd star = rating 3
    expect(onChange).toHaveBeenCalledWith(3);
  });

  it('does not call onChange when readOnly', async () => {
    const onChange = jest.fn();
    render(<StarRating readOnly onChange={onChange} />);
    // No buttons rendered in readOnly mode
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('pre-fills stars according to value', () => {
    const { container } = render(<StarRating value={3} />);
    const filled = container.querySelectorAll('.star.filled');
    expect(filled).toHaveLength(3);
  });
});
