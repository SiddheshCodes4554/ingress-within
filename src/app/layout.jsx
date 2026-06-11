import { Cormorant_Garamond, DM_Sans } from 'next/font/google';
import '../index.css';

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  style: ['normal', 'italic'],
  variable: '--font-serif',
  display: 'swap',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '700'],
  variable: '--font-sans',
  display: 'swap',
});

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
    <html lang="en" suppressHydrationWarning className={`scroll-smooth ${cormorant.variable} ${dmSans.variable}`}>
      <body className="selection:bg-accent/40 selection:text-primary">
        <div id="root">
          {children}
        </div>
      </body>
    </html>
  );
}
