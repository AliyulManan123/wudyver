import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import apiConfig from "@/configs/apiConfig";
import axios from "axios";
import { RateLimiterMemory } from "rate-limiter-flexible";

const DOMAIN_URL = apiConfig.DOMAIN_URL || "localhost";
const NEXTAUTH_SECRET = apiConfig.JWT_SECRET;
const DEFAULT_PROTOCOL = "https://";

const axiosInstance = axios.create({
  headers: {
    "Content-Type": "application/json",
    "Accept-Encoding": "gzip, deflate, br, zstd",
  },
});

const rateLimiter = new RateLimiterMemory({
  points: apiConfig.LIMIT_POINTS,
  duration: apiConfig.LIMIT_DURATION,
});

export const config = {
  matcher: ["/", "/login", "/register", "/logout", "/analytics", "/api/:path*"],
};

function ensureProtocol(url, defaultProtocol) {
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    return defaultProtocol + url;
  }
  return url;
}

export async function middleware(req) {
  let response = NextResponse.next();
  try {
    const url = new URL(req.url);
    const { pathname } = url;
    const ipAddress = req.ip || req.headers.get("x-forwarded-for") || "unknown";

    const isApiRoute = pathname.startsWith("/api");
    const isLoginRoute = pathname === "/login";
    const isRegisterRoute = pathname === "/register";
    const isAuthPage = isLoginRoute || isRegisterRoute;
    const isAnalyticsRoute = pathname === "/analytics";
    const isRootRoute = pathname === "/";

    const nextAuthToken = await getToken({ req, secret: NEXTAUTH_SECRET });
    const isAuthenticated = !!nextAuthToken;

    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("X-Frame-Options", "DENY");
    response.headers.set("X-XSS-Protection", "1; mode=block");
    response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
    response.headers.set("Access-Control-Allow-Origin", "*");
    response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    response.headers.set("Access-Control-Allow-Credentials", "true");

    const isVisitorApi = pathname.includes("/api/visitor");
    const isAuthApi = pathname.includes("/api/auth");
    const isGeneralApi = pathname.includes("/api/general");

    if (isApiRoute && !isVisitorApi && !isAuthApi && !isGeneralApi) {
      try {
        const rateLimiterRes = await rateLimiter.consume(ipAddress, 1);
        response.headers.set("X-RateLimit-Limit", apiConfig.LIMIT_POINTS);
        response.headers.set("X-RateLimit-Remaining", rateLimiterRes.remainingPoints);
        response.headers.set("X-RateLimit-Reset", Math.ceil((Date.now() + rateLimiterRes.msBeforeNext) / 1e3));
      } catch (rateLimiterError) {
        const retryAfterSeconds = Math.ceil(rateLimiterError.msBeforeNext / 1e3);
        const totalLimit = apiConfig.LIMIT_POINTS;
        return new NextResponse(JSON.stringify({
          status: "error",
          code: 429,
          message: `Terlalu banyak permintaan. Anda telah melampaui batas ${totalLimit} permintaan per ${apiConfig.LIMIT_DURATION} detik. Silakan coba lagi dalam ${retryAfterSeconds} detik.`,
          limit: totalLimit,
          remaining: 0,
          retryAfter: retryAfterSeconds
        }), {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": retryAfterSeconds.toString(),
            "X-RateLimit-Limit": totalLimit.toString(),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": Math.ceil((Date.now() + rateLimiterError.msBeforeNext) / 1e3).toString()
          }
        });
      }
    }

    const redirectUrlWithProtocol = ensureProtocol(DOMAIN_URL, DEFAULT_PROTOCOL);

    if (isAuthenticated) {
      if (isAuthPage) {
        return NextResponse.redirect(`${redirectUrlWithProtocol}/analytics`);
      }
      return response;
    } else {
      if (isAnalyticsRoute || isRootRoute) {
        return NextResponse.redirect(`${redirectUrlWithProtocol}/login`);
      }
      return response;
    }

    (async () => {
      try {
        const baseURL = ensureProtocol(DOMAIN_URL, DEFAULT_PROTOCOL);

        if (isApiRoute && !isVisitorApi && !isAuthApi && !isGeneralApi) {
          await axiosInstance.get(`${baseURL}/api/visitor/req`);
        } else if (!isApiRoute && !isAuthPage) {
          await axiosInstance.get(`${baseURL}/api/visitor/visit`);
          await axiosInstance.post(`${baseURL}/api/visitor/info`, {
            route: pathname,
            time: new Date().toISOString(),
            hit: 1
          });
        }
      } catch (err) {
        const errorMessage = err.response ? `Status ${err.response.status}: ${err.response.data?.message || err.message}` : err.message;
        console.error(`[Middleware] Gagal mencatat pengunjung untuk ${pathname}: ${errorMessage}`);
      }
    })();

    return response;
  } catch (error) {
    console.error("[Middleware] Kesalahan tidak tertangani:", error);
    return new NextResponse(JSON.stringify({
      status: "error",
      code: 500,
      message: "Kesalahan Server Internal"
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY",
        "X-XSS-Protection": "1; mode=block",
        "Referrer-Policy": "strict-origin-when-cross-origin",
        "Permissions-Policy": "camera=(), microphone=(), geolocation=()"
      }
    });
  }
}