import { getServerSession } from "next-auth";
import { authOptions } from "./api/auth/[...nextauth]/route";
import Providers from "./providers";

export default async function RootLayout({ children }) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="en">
      <head>
      </head>
      <body className="font-inter custom-tippy dashcode-app">
        <Providers session={session}>
          {children}
        </Providers>
      </body>
    </html>
  );
}
