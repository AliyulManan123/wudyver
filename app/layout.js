import { Inter } from "next/font/google";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Providers from "./providers";
import apiConfig from "@/configs/apiConfig";

const inter = Inter({ subsets: ["latin"] });

const domain = `https://${apiConfig.DOMAIN_URL}`;
const faviconIcoPath = "/favicon.ico";
const faviconPngPath = "/favicon.png";
const faviconSvgPath = "/favicon.svg";
const pwaIcon192 = "/images/favicon/favicon.png";
const pwaIcon512 = "/images/favicon/favicon.png";
const appleTouchIcon = "/images/favicon/favicon.png";
const socialShareImage = "/assets/images/all-img/main-user.png";

export const metadata = {
  title: "DashCode API Dashboard",
  description: "DashCode API Dashboard: Template admin open-source Next.js 13 dengan fitur API dan komponen server terbaru. Futuristik, cepat, dan responsif.",
  generator: "Next.js 13",
  manifest: "/manifest.json",
  keywords: [
    "nextjs", "next14", "pwa", "next-pwa", "dashcode", "admin", "dashboard",
    "DashCode", "Web API", "Next.js 13", "Dashboard admin", "template admin",
    "aplikasi web", "open-source", "server components", "PWA", "modern", "futuristik"
  ],
  themeColor: "#2196F3",
  authors: [
    { name: "AyGemuy", url: "https://www.github.com/AyGemuy/" },
    { name: "DashCode Developer" }
  ],
  viewport:
    "minimum-scale=1, initial-scale=1, width=device-width, shrink-to-fit=no, user-scalable=no, viewport-fit=cover",
  icons: {
    icon: [
      { url: faviconPngPath, sizes: "any", type: "image/png" },
      { url: faviconIcoPath, sizes: "any", type: "image/x-icon" },
      { url: faviconSvgPath, type: "image/svg+xml" },
      { rel: "mask-icon", url: faviconSvgPath, color: "#2196F3" },
    ],
    apple: [{ url: appleTouchIcon, sizes: "180x180" }],
  },
  appleWebApp: {
    capable: true,
    title: "DashCode",
    statusBarStyle: "default",
  },
  applicationName: "DashCode API Dashboard",
  alternates: { canonical: domain },
  openGraph: {
    type: "website",
    title: "DashCode API Dashboard - Modern Admin Panel",
    description: "Jelajahi DashCode API Dashboard, template admin Next.js 13 open-source dengan performa tinggi dan desain futuristik. Dibangun untuk aplikasi web modern.",
    url: domain,
    siteName: "DashCode",
    images: [{ url: `${domain}${socialShareImage}`, width: 1200, height: 630, alt: "DashCode API Dashboard Social Share Image" }],
    locale: "id_ID",
  },
  twitter: {
    card: "summary_large_image",
    site: "@DashCode_dev",
    creator: "@DashCode_dev",
    title: "DashCode API Dashboard - Modern Admin Panel",
    description: "DashCode API Dashboard: Template admin Next.js 13 open-source dengan fitur API dan komponen server terbaru. Futuristik, cepat, dan responsif.",
    images: [`${domain}${socialShareImage}`],
  },
  verification: {
    google: "E5QX7KBlw_hIr1JP7QY6n_A74Uys6lCj-KfGws9UrV4",
  },
  other: {
    "format-detection": "telephone=no",
    "mobile-web-app-capable": "yes",
    "msapplication-config": "/browserconfig.xml",
    "msapplication-TileColor": "#2B5797",
    "msapplication-tap-highlight": "no",
    "google-adsense-account": "ca-pub-1389266588531643",
  },
};

export default async function RootLayout({ children }) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="id">
      <head>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Roboto:300,400,500" />
      </head>
      <body className={`${inter.className} font-inter custom-tippy dashcode-app`}>
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1389266588531643"
          crossOrigin="anonymous"
        ></script>
        <Providers session={session}>
          {children}
        </Providers>
      </body>
    </html>
  );
}