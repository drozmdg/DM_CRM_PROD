import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';

describe('Card Components', () => {
  describe('Card', () => {
    it('should render card with default styling', () => {
      render(<Card data-testid="card">Card content</Card>);
      
      const card = screen.getByTestId('card');
      expect(card).toBeInTheDocument();
      expect(card).toHaveClass(
        'rounded-lg',
        'border',
        'bg-card',
        'text-card-foreground',
        'shadow-sm'
      );
    });

    it('should accept custom className', () => {
      render(<Card className="custom-card">Custom card</Card>);
      
      const card = screen.getByText('Custom card');
      expect(card).toHaveClass('custom-card');
    });

    it('should forward additional props', () => {
      render(<Card data-testid="props-card" role="region">Props test</Card>);
      
      const card = screen.getByTestId('props-card');
      expect(card).toHaveAttribute('role', 'region');
    });
  });

  describe('CardHeader', () => {
    it('should render header with correct styling', () => {
      render(<CardHeader data-testid="header">Header content</CardHeader>);
      
      const header = screen.getByTestId('header');
      expect(header).toBeInTheDocument();
      expect(header).toHaveClass('flex', 'flex-col', 'space-y-1.5', 'p-6');
    });

    it('should accept custom className', () => {
      render(<CardHeader className="custom-header">Custom header</CardHeader>);
      
      const header = screen.getByText('Custom header');
      expect(header).toHaveClass('custom-header');
    });
  });

  describe('CardTitle', () => {
    it('should render title with correct styling', () => {
      render(<CardTitle data-testid="title">Card Title</CardTitle>);
      
      const title = screen.getByTestId('title');
      expect(title).toBeInTheDocument();
      expect(title).toHaveClass(
        'text-2xl',
        'font-semibold',
        'leading-none',
        'tracking-tight'
      );
    });

    it('should render as h3 by default', () => {
      render(<CardTitle>Default Title</CardTitle>);
      
      const title = screen.getByRole('heading', { level: 3 });
      expect(title).toBeInTheDocument();
      expect(title).toHaveTextContent('Default Title');
    });

    it('should accept custom className', () => {
      render(<CardTitle className="custom-title">Custom title</CardTitle>);
      
      const title = screen.getByText('Custom title');
      expect(title).toHaveClass('custom-title');
    });
  });

  describe('CardDescription', () => {
    it('should render description with correct styling', () => {
      render(<CardDescription data-testid="description">Card description</CardDescription>);
      
      const description = screen.getByTestId('description');
      expect(description).toBeInTheDocument();
      expect(description).toHaveClass('text-sm', 'text-muted-foreground');
    });

    it('should render as paragraph by default', () => {
      render(<CardDescription>This is a description</CardDescription>);
      
      const description = screen.getByText('This is a description');
      expect(description.tagName).toBe('P');
    });

    it('should accept custom className', () => {
      render(<CardDescription className="custom-desc">Custom description</CardDescription>);
      
      const description = screen.getByText('Custom description');
      expect(description).toHaveClass('custom-desc');
    });
  });

  describe('CardContent', () => {
    it('should render content with correct styling', () => {
      render(<CardContent data-testid="content">Card content</CardContent>);
      
      const content = screen.getByTestId('content');
      expect(content).toBeInTheDocument();
      expect(content).toHaveClass('p-6', 'pt-0');
    });

    it('should accept custom className', () => {
      render(<CardContent className="custom-content">Custom content</CardContent>);
      
      const content = screen.getByText('Custom content');
      expect(content).toHaveClass('custom-content');
    });
  });

  describe('CardFooter', () => {
    it('should render footer with correct styling', () => {
      render(<CardFooter data-testid="footer">Card footer</CardFooter>);
      
      const footer = screen.getByTestId('footer');
      expect(footer).toBeInTheDocument();
      expect(footer).toHaveClass('flex', 'items-center', 'p-6', 'pt-0');
    });

    it('should accept custom className', () => {
      render(<CardFooter className="custom-footer">Custom footer</CardFooter>);
      
      const footer = screen.getByText('Custom footer');
      expect(footer).toHaveClass('custom-footer');
    });
  });

  describe('Complete Card Structure', () => {
    it('should render complete card with all components', () => {
      render(
        <Card data-testid="complete-card">
          <CardHeader>
            <CardTitle>Test Card</CardTitle>
            <CardDescription>This is a test card description</CardDescription>
          </CardHeader>
          <CardContent>
            <p>This is the card content</p>
          </CardContent>
          <CardFooter>
            <button>Action Button</button>
          </CardFooter>
        </Card>
      );

      // Verify all parts are rendered
      expect(screen.getByTestId('complete-card')).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Test Card' })).toBeInTheDocument();
      expect(screen.getByText('This is a test card description')).toBeInTheDocument();
      expect(screen.getByText('This is the card content')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Action Button' })).toBeInTheDocument();
    });

    it('should maintain proper semantic structure', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Semantic Card</CardTitle>
            <CardDescription>Semantic description</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Semantic content</p>
          </CardContent>
          <CardFooter>
            <span>Footer content</span>
          </CardFooter>
        </Card>
      );

      // Check semantic structure
      const title = screen.getByRole('heading');
      expect(title).toHaveTextContent('Semantic Card');
      
      const description = screen.getByText('Semantic description');
      expect(description.tagName).toBe('P');
      
      const content = screen.getByText('Semantic content');
      expect(content.tagName).toBe('P');
    });

    it('should handle nested content properly', () => {
      render(
        <Card>
          <CardContent>
            <div>
              <h4>Nested Title</h4>
              <ul>
                <li>Item 1</li>
                <li>Item 2</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      );

      expect(screen.getByRole('heading', { level: 4, name: 'Nested Title' })).toBeInTheDocument();
      expect(screen.getByRole('list')).toBeInTheDocument();
      expect(screen.getAllByRole('listitem')).toHaveLength(2);
    });
  });
});