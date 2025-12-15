import { render, screen } from '@testing-library/react';
import App from './App';

test('renders New Fun Fact button and a fact', () => {
  render(<App />);
  const btn = screen.getByRole('button', { name: /new fun fact/i });
  expect(btn).toBeInTheDocument();

  // Initial fact from local list should be visible
  const factText = screen.getByText(/!/i, { selector: 'p' }); // most facts end with punctuation; generic presence check
  expect(factText).toBeInTheDocument();
});
