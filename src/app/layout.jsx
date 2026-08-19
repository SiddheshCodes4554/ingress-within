import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";
import '../index.css';

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://ingresswithin.com'),
  title: {
    default: 'Ingress Within | Understand. Grow. Continue.',
    template: '%s | Ingress Within'
  },
  description: 'Ingress Within combines daily guided journaling with psychometric exercises and linguistic analysis to generate high-resolution weekly and monthly reports, helping you understand your emotional patterns, stress triggers, and personal progress.',
  keywords: [
    'Ingress Within',
    'Guided Journaling',
    'Mental Wellness',
    'Self Reflection',
    'Personal Growth',
    'Psychometric Exercises',
    'Emotional Granularity',
    'Personalized Reports',
    'Cognitive Behavioral Journal',
    'Emotional Balance',
    'Pattern Intelligence'
  ],
  authors: [{ name: 'Ingress Within' }],
  creator: 'Ingress Within',
  publisher: 'Ingress Within',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    title: 'Ingress Within | Understand. Grow. Continue.',
    description: 'Translate daily reflection into clear, actionable patterns. Explore your stress triggers, daily consistency, and cognitive growth with scientifically derived weekly and monthly reports.',
    url: 'https://ingresswithin.com',
    siteName: 'Ingress Within',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Ingress Within — Understand. Grow. Continue.',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ingress Within | Understand. Grow. Continue.',
    description: 'Translate daily reflection into clear, actionable patterns and personal growth.',
    images: ['/og-image.png'],
    creator: '@ingresswithin',
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  manifest: '/site.webmanifest',
};

export const viewport = {
  themeColor: '#ECEFF0',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning className="scroll-smooth">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400;1,500;1,600&family=DM+Sans:ital,opsz,wght@0,9..40,300..700;1,9..40,300..700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="selection:bg-accent/40 selection:text-primary">
        <div id="root">
          {children}
        </div>
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
