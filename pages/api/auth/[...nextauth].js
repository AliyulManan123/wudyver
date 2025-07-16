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
      async authorize(credentials) {
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

          if (res.ok && result.user && result.token) { // Ensure result.token exists
            const user = result.user;
            return {
              id: user._id,
              name: user.email?.split("@")[0] || "User",
              email: user.email,
              isNewSignIn: true,
              token: result.token, // Store the 'token' from your API response here
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
        token.isNewSignIn = user.isNewSignIn;
        // If the user object from Credentials provider has a 'token' property
        if (user.token) {
          token.apiToken = user.token; // Store it as 'apiToken' in the JWT
        }
      }

      // For OAuth providers, `account.access_token` is automatically provided by NextAuth
      if (account) {
        token.accessToken = account.access_token; // This is the OAuth provider's access token
        token.provider = account.provider;
      }
      return token;
    },

    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.email = token.email;
        session.isNewSignIn = token.isNewSignIn;
        // The token from your API (Credentials provider)
        session.apiToken = token.apiToken;
        // The access token from OAuth providers
        session.accessToken = token.accessToken;
        session.provider = token.provider;
      }
      return session;
    },

    async signIn({ user, account, profile, email, credentials, url }) {
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