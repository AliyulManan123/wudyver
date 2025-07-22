import { Inter } from "next/font/google";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Providers from "./providers";
import { generateMetadata } from "./head";
import { ImageResponse } from "next/og";

const inter = Inter({ subsets: ["latin"] });

// Export metadata dari head.js
export { metadata } from "./head";

export default async function RootLayout({ children }) {
  const session = await getServerSession(authOptions);
  
  return (
    <html lang="id">
      <head>
        {/* Preconnect untuk performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link rel="preconnect" href="https://pagead2.googlesyndication.com" />
        
        {/* Fonts */}
        <link 
          rel="stylesheet" 
          href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap" 
        />
        
        {/* Additional SEO meta tags */}
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
        <meta name="googlebot" content="index, follow" />
        <meta name="bingbot" content="index, follow" />
        
        {/* Performance hints */}
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        <link rel="dns-prefetch" href="//pagead2.googlesyndication.com" />
        
        {/* Security headers */}
        <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
        <meta httpEquiv="X-Frame-Options" content="DENY" />
        <meta httpEquiv="X-XSS-Protection" content="1; mode=block" />
        
        {/* Additional PWA meta tags */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="DashCode" />
        
        {/* Structured data for organization */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              "name": "DashCode API Dashboard",
              "description": "Template admin Next.js 13 open-source dengan fitur API dan komponen server terbaru",
              "url": "https://wudysoft.xyz",
              "applicationCategory": "BusinessApplication",
              "operatingSystem": "Web Browser",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD"
              }
            })
          }}
        />
      </head>
      <body className={`${inter.className} font-inter custom-tippy dashcode-app`}>
        {/* Google AdSense */}
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1389266588531643"
          crossOrigin="anonymous"
        />
        
        {/* Google Analytics (optional) */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'GA_MEASUREMENT_ID');
            `
          }}
        />
        
        <Providers session={session}>
          {children}
        </Providers>
      </body>
    </html>
  );
}