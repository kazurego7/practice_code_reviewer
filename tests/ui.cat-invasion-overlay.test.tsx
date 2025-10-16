import { render, screen } from '@testing-library/react';
import React from 'react';
import { CatInvasionOverlay } from '@/app/components/CatInvasionOverlay';

describe('CatInvasionOverlay', () => {
  it('renders nothing when inactive', () => {
    const { container } = render(
      <CatInvasionOverlay active={false} imageSrc="/cat-invasion.svg" />
    );
    expect(container.firstChild).toBeNull();
  });

  it('displays the cat image full screen when active', () => {
    render(<CatInvasionOverlay active imageSrc="/cat-invasion.svg" />);
    const root = document.querySelector('.fixed.inset-0.z-50');
    expect(root).not.toBeNull();
    expect(screen.getByAltText('乱入してきた猫の写真')).toBeInTheDocument();
  });

  it('allows overriding the caption', () => {
    render(
      <CatInvasionOverlay
        active
        imageSrc="/cat-invasion.svg"
        caption="テストキャプション"
      />
    );
    expect(screen.getByText('テストキャプション')).toBeInTheDocument();
  });
});
