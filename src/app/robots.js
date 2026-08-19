export default function robots() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://ingresswithin.com';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/admin/',
          '/dashboard',
          '/write',
          '/interventions',
          '/reports',
          '/patterns',
          '/knowledge',
          '/settings',
          '/session/',
          '/onboarding',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
