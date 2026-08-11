import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";
import '../index.css';

export const metadata = {
  title: 'Ingress Within | Guided Journaling & Personalized Mental Wellness Reports',
  description: 'Ingress Within combines daily guided journaling with psychometric exercises and linguistic analysis to generate high-resolution weekly and monthly reports, helping you understand your emotional patterns, stress triggers, and personal progress.',
  keywords: 'Mental Wellness, Guided Journaling, Self Reflection, Personal Growth, Psychometric Exercises, Personalized Reports, Cognitive Behavioral Journal, Emotional Balance',
  openGraph: {
    title: 'Ingress Within | Guided Journaling & Personalized Mental Reflection',
    description: 'Translate daily reflection into clear, actionable patterns. Explore your stress triggers, daily consistency, and cognitive growth with scientifically derived weekly and monthly reports.',
    type: 'website',
    siteName: 'Ingress Within',
  },
  icons: {
    icon: '/favicon.svg',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning className="scroll-smooth">
      <head>
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
