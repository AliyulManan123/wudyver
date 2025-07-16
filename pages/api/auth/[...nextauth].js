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
          console.log("[NextAuth] Attempting credentials sign-in for:", credentials.email);
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
            console.log("[NextAuth] Credentials sign-in successful for:", user.email);
            return {
              id: user._id,
              name: user.email?.split("@")[0] || "User",
              email: user.email,
              token: result.token,
              isNewSignIn: true,
            };
          } else {
            console.warn("[NextAuth] Credentials sign-in failed:", result.message || "Invalid credentials");
            throw new Error(result.message || "Invalid credentials");
          }
        } catch (error) {
          console.error("[NextAuth] Authentication error (Credentials):", error.message);
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
    async jwt({ token, user, account, isNewUser }) {
      console.log("[NextAuth Callback - JWT] Processing token:", { token, user, account, isNewUser });

      if (user) {
        token.id = user.id || user._id;
        token.email = user.email;
        token.isNewSignIn = (user.isNewSignIn || isNewUser) ? true : token.isNewSignIn;
        if (user.token) {
          token.apiToken = user.token;
        }
        console.log("[NextAuth Callback - JWT] User data processed. isNewSignIn:", token.isNewSignIn);
      }

      if (account) {
        token.accessToken = account.access_token;
        token.provider = account.provider;
        if (!token.isNewSignIn && isNewUser) {
          token.isNewSignIn = true;
          console.log("[NextAuth Callback - JWT] OAuth new user detected. isNewSignIn set to true.");
        }
        console.log("[NextAuth Callback - JWT] Account data processed. Provider:", account.provider);
      }
      
      return token;
    },

    async session({ session, token }) {
      console.log("[NextAuth Callback - Session] Processing session:", { session, token });
      if (token) {
        session.user.id = token.id;
        session.user.email = token.email;
        session.isNewSignIn = token.isNewSignIn;
        session.apiToken = token.apiToken;
        session.accessToken = token.accessToken;
        session.provider = token.provider;
        console.log("[NextAuth Callback - Session] Session updated. isNewSignIn:", session.isNewSignIn);

        token.isNewSignIn = false; 
        console.log("[NextAuth Callback - Session] isNewSignIn reset to false in token for subsequent requests.");
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    signOut: "/logout",
    error: "/not-found",
  },
  secret: apiConfig.JWT_SECRET,
  debug: true, 
});