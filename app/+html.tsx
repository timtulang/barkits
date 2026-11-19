import { ScrollViewStyleReset } from 'expo-router/html';
import { ReactNode } from 'react';

export default function Root({ children }: { children: ReactNode }) {
  return <html lang="en-PH">
    <head>
      <meta charSet="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta name="theme-color" content="#FFF9EF" />
      <title>Barkits · Plan your next meetup</title>
      <ScrollViewStyleReset />
    </head>
    <body>{children}</body>
  </html>;
}
