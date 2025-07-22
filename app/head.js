import apiConfig from "@/configs/apiConfig";

const domain = `https://${apiConfig.DOMAIN_URL}`;
const faviconIcoPath = "/favicon.ico";
const faviconPngPath = "/favicon.png";
const faviconSvgPath = "/favicon.svg";
const pwaIcon192 = "/images/favicon/favicon.png";
const pwaIcon512 = "/images/favicon/favicon.png";
const appleTouchIcon = "/images/favicon/favicon.png";
const socialShareImage = "/images/favicon/favicon.png";

export const metadata = {
  metadataBase: new URL(domain),
  title: {
    default: "DashCode API Dashboard",
    template: "%s | DashCode API Dashboard"
  },
  description: "DashCode API Dashboard: Template admin open-source Next.js 13 dengan fitur API dan komponen server terbaru. Futuristik, cepat, dan responsif.",
  generator: "Next.js 13",
  manifest: "/manifest.json",
  keywords: [
    "nextjs", "next14", "pwa", "next-pwa", "dashcode", "admin", "dashboard",
    "DashCode", "Web API", "Next.js 13", "Dashboard admin", "template admin",
    "aplikasi web", "open-source", "server components", "PWA", "modern", "futuristik",
    "typescript", "tailwind", "react", "responsive", "mobile-first"
  ],
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#2196F3" },
    { media: "(prefers-color-scheme: dark)", color: "#1976D2" }
  ],
  colorScheme: "light dark",
  authors: [
    { name: "AyGemuy", url: "https://www.github.com/AyGemuy/" },
    { name: "DashCode Developer" }
  ],
  creator: "AyGemuy",
  publisher: "DashCode Team",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    minimumScale: 1,
    userScalable: false,
    viewportFit: "cover"
  },
  icons: {
    icon: [
      { url: faviconPngPath, sizes: "32x32", type: "image/png" },
      { url: faviconIcoPath, sizes: "16x16 32x32", type: "image/x-icon" },
      { url: faviconSvgPath, type: "image/svg+xml" },
    ],
    shortcut: [faviconIcoPath],
    apple: [
      { url: appleTouchIcon, sizes: "180x180", type: "image/png" },
    ],
    other: [
      {
        rel: "mask-icon",
        url: faviconSvgPath,
        color: "#2196F3"
      }
    ]
  },
  appleWebApp: {
    capable: true,
    title: "DashCode",
    statusBarStyle: "default",
    startupImage: [
      {
        url: "/images/favicon/favicon.png",
        media: "(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"
      },
      {
        url: "/images/favicon/favicon.png", 
        media: "(device-width: 834px) and (device-height: 1112px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"
      }
    ]
  },
  applicationName: "DashCode API Dashboard",
  category: "productivity",
  classification: "Business Application",
  alternates: {
    canonical: domain,
    languages: {
      "id-ID": `${domain}/id`,
      "en-US": `${domain}/en`,
    }
  },
  openGraph: {
    type: "website",
    title: "DashCode API Dashboard - Modern Admin Panel",
    description: "Jelajahi DashCode API Dashboard, template admin Next.js 13 open-source dengan performa tinggi dan desain futuristik. Dibangun untuk aplikasi web modern.",
    url: domain,
    siteName: "DashCode",
    images: [
      {
        url: `${domain}${socialShareImage}`,
        width: 1200,
        height: 630,
        alt: "DashCode API Dashboard Social Share Image",
        type: "image/png"
      },
      {
        url: `${domain}/images/favicon/favicon.png`,
        width: 400,
        height: 400,
        alt: "DashCode Square Logo"
      }
    ],
    locale: "id_ID",
    alternateLocale: ["en_US"]
  },
  twitter: {
    card: "summary_large_image",
    site: "@DashCode_dev",
    creator: "@DashCode_dev",
    title: "DashCode API Dashboard - Modern Admin Panel",
    description: "DashCode API Dashboard: Template admin Next.js 13 open-source dengan fitur API dan komponen server terbaru. Futuristik, cepat, dan responsif.",
    images: {
      url: `${domain}${socialShareImage}`,
      alt: "DashCode API Dashboard"
    }
  },
  verification: {
    google: "E5QX7KBlw_hIr1JP7QY6n_A74Uys6lCj-KfGws9UrV4",
    yandex: "your-yandex-verification-code",
    yahoo: "your-yahoo-verification-code",
    other: {
      "msvalidate.01": "your-bing-verification-code"
    }
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  other: {
    "format-detection": "telephone=no",
    "mobile-web-app-capable": "yes",
    "msapplication-config": "/browserconfig.xml",
    "msapplication-TileColor": "#2B5797",
    "msapplication-TileImage": "/images/favicon/ms-icon-144x144.png",
    "msapplication-tap-highlight": "no",
    "google-adsense-account": "ca-pub-1389266588531643",
    "theme-color": "#2196F3",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent"
  },
};

// Fungsi untuk generate metadata dinamis berdasarkan halaman
export function generateMetadata({ params, searchParams }) {
  return {
    ...metadata,
    title: `${params?.title || "Dashboard"} | DashCode API Dashboard`,
    description: params?.description || metadata.description,
    openGraph: {
      ...metadata.openGraph,
      title: `${params?.title || "Dashboard"} | DashCode API Dashboard`,
      description: params?.description || metadata.description,
    },
    twitter: {
      ...metadata.twitter,
      title: `${params?.title || "Dashboard"} | DashCode API Dashboard`,
      description: params?.description || metadata.description,
    }
  };
}