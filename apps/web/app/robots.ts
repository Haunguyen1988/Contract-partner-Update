import { MetadataRoute } from 'next'
 
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/admin/', '/audit/'],
    },
    sitemap: 'https://contract-partner.vercel.app/sitemap.xml',
  }
}
