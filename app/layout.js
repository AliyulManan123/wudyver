// app/layout.js
// No 'use client' here, RootLayout remains a Server Component
import Head from "./head"; // Assuming this is a component for meta tags
import Providers from "./providers"; // Import the Providers client component

/**
 * @param {Object} props - Component props.
 * @param {React.ReactNode} props.children - The child components (pages or other layouts).
 * @returns {JSX.Element} The root HTML structure of the application.
 */
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* Head component for meta tags and other head elements */}
        <Head />
      </head>
      <body className="font-inter custom-tippy dashcode-app">
        {/*
          The Providers component is a client component that wraps all client-side
          contexts, including NextAuth's SessionProvider, Redux Provider, etc.
          This allows RootLayout to remain a Server Component while providing
          client-side contexts to its children.
        */}
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
