import React from 'react';
import { render, screen } from '@testing-library/react';
import ContentCard from './ContentCard';
import { MemoryRouter } from 'react-router-dom';

const mockItem = {
  _id: '123',
  title: 'Test Article Title',
  description: 'A test description for the content card component',
  category: 'technology',
  tags: ['AI', 'react'],
  author: 'Test Author',
  imageUrl: '',
  viewCount: 100,
  likeCount: 25,
};

describe('ContentCard', () => {
  const renderCard = (props = {}) =>
    render(
      <MemoryRouter>
        <ContentCard item={mockItem} {...props} />
      </MemoryRouter>
    );

  it('renders the title', () => {
    renderCard();
    expect(screen.getByText('Test Article Title')).toBeInTheDocument();
  });

  it('renders the category badge', () => {
    renderCard();
    expect(screen.getByText('technology')).toBeInTheDocument();
  });

  it('renders the author', () => {
    renderCard();
    expect(screen.getByText(/Test Author/)).toBeInTheDocument();
  });

  it('renders tags', () => {
    renderCard();
    expect(screen.getByText('AI')).toBeInTheDocument();
    expect(screen.getByText('react')).toBeInTheDocument();
  });

  it('renders match score when provided', () => {
    renderCard({ score: 0.85 });
    expect(screen.getByText(/Match 85%/)).toBeInTheDocument();
  });

  it('does not render match score when not provided', () => {
    renderCard();
    expect(screen.queryByText(/Match/)).not.toBeInTheDocument();
  });

  it('links to the correct content detail page', () => {
    renderCard();
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/content/123');
  });
});
