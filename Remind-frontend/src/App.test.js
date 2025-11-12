import { render, screen } from '@testing-library/react';
import React from 'react';

jest.mock(
  'react-router-dom',
  () => {
    const React = require('react');

    return {
      BrowserRouter: ({ children }) => <>{children}</>,
    Routes: ({ children }) => {
      const routes = React.Children.toArray(children);
      const homeRoute = routes.find((route) => route.props.path === '/');
      return homeRoute ? homeRoute.props.element : null;
    },
    Route: ({ element }) => element,
    Link: ({ children, to, ...rest }) => (
      <a {...rest} href={to}>
        {children}
      </a>
    ),
    useNavigate: () => () => {},
  };
  },
  { virtual: true }
);

import App from './App';

test('renders landing hero copy', () => {
  render(<App />);
  expect(screen.getByText('AI 기반 멘탈 성장 회고 플랫폼')).toBeInTheDocument();
  expect(screen.getAllByRole('link', { name: '로그인' }).length).toBeGreaterThan(0);
});
