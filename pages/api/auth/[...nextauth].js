import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import GithubProvider from "next-auth/providers/github";
import apiConfig from "@/configs/apiConfig";

export default NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        try {
          const res = await fetch(`https://${apiConfig.DOMAIN_URL}/api/auth-v2/sign-in`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          });

          const result = await res.json();

          if (res.ok && result.user && result.token) {
            const user = result.user;
            return {
              id: user._id,
              name: user.email?.split("@")[0] || "User",
              email: user.email,
              token: result.token,
              isNewSignIn: true, // Pastikan ini disetel saat login berhasil via credentials
            };
          } else {
            throw new Error(result.message || "Invalid credentials");
          }
        } catch (error) {
          console.error("Authentication error:", error);
          throw new Error(error.message || "Terjadi kesalahan saat login");
        }
      },
    }),
    GoogleProvider({
      clientId: apiConfig.GOOGLE_CLIENT_ID,
      clientSecret: apiConfig.GOOGLE_CLIENT_SECRET,
    }),
    GithubProvider({
      clientId: apiConfig.GITHUB_ID,
      clientSecret: apiConfig.GITHUB_SECRET,
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        // isNewSignIn hanya akan ada jika user berasal dari authorize (login/register baru)
        token.isNewSignIn = user.isNewSignIn || false;
        if (user.token) {
          token.apiToken = user.token;
        }
      }

      if (account) {
        token.accessToken = account.access_token;
        token.provider = account.provider;
        // Untuk OAuth, tandai sebagai isNewSignIn saat pertama kali masuk (saat 'account' ada)
        if (!token.isNewSignIn) { // Hindari menimpa jika sudah disetel dari credentials
             token.isNewSignIn = true;
        }
      }
      return token;
    },

    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.email = token.email;
        session.isNewSignIn = token.isNewSignIn;
        session.apiToken = token.apiToken;
        session.accessToken = token.accessToken;
        session.provider = token.provider;
      }
      return session;
    },

    async signIn({ user, account, profile, email, credentials, url }) {
        // NextAuth secara otomatis mengarahkan ke callbackUrl setelah berhasil
        // Jika tidak ada callbackUrl, ia akan mengarahkan ke root (/)
        // atau jika diatur dalam pages.signIn, akan ke sana.
        // Cukup kembalikan true untuk membiarkan NextAuth menangani redirect default
        // atau string untuk redirect kustom.
        // Karena Anda ingin selalu ke /analytics, ini sudah benar.
      return "/analytics";
    },
  },
  pages: {
    signIn: "/login",
    signOut: "/logout",
    error: "/error",
  },
  secret: apiConfig.JWT_SECRET,
  session: {
    strategy: "jwt",
    maxAge: 1 * 24 * 60 * 60,
  },
});