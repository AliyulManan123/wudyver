import {
    NextResponse,
    NextRequest
} from "next/server";
import {
    getToken
} from "next-auth/jwt";
import apiConfig from "@/configs/apiConfig";
import axios from "axios";
import {
    RateLimiterMemory
} from "rate-limiter-flexible";

/**
 * Mengambil alamat IP klien dari permintaan.
 * @param {NextRequest} req Objek permintaan Next.js.
 * @returns {string} Alamat IP klien atau "unknown" jika tidak ditemukan.
 */
function getClientIp(req) {
    return req.ip || req.headers.get("x-forwarded-for") || "unknown";
}

// Konfigurasi penting dari apiConfig. Pastikan nilai-nilai ini benar dan konsisten.
const DOMAIN_URL = apiConfig.DOMAIN_URL || "localhost";
// NEXTAUTH_SECRET HARUS SAMA PERSIS dengan secret yang digunakan di konfigurasi NextAuth.js Anda
// (misalnya, di pages/api/auth/[...nextauth].js atau sebagai variabel lingkungan).
// Ketidakcocokan di sini adalah penyebab utama masalah autentikasi.
const NEXTAUTH_SECRET = apiConfig.JWT_SECRET;
const DEFAULT_PROTOCOL = "https://"; // Protokol default untuk URL

// Buat instance Axios untuk permintaan pelacakan
const axiosInstance = axios.create({
    headers: {
        "Content-Type": "application/json",
        "Accept-Encoding": "gzip, deflate, br, zstd"
    }
});

// Inisialisasi pembatas laju (rate limiter) menggunakan konfigurasi dari apiConfig.
const rateLimiter = new RateLimiterMemory({
    points: apiConfig.LIMIT_POINTS, // Jumlah permintaan yang diizinkan
    duration: apiConfig.LIMIT_DURATION // Durasi dalam detik
});

// Konfigurasi matcher middleware.
// Ini memastikan middleware berjalan untuk semua jalur kecuali aset statis Next.js,
// gambar, favicon.ico, dan file dengan ekstensi (misalnya .js, .css, .png).
export const config = {
    matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.).*)"]
};

/**
 * Memastikan URL memiliki protokol (http:// atau https://).
 * @param {string} url URL yang akan diperiksa.
 * @param {string} defaultProtocol Protokol yang akan ditambahkan jika tidak ada.
 * @returns {string} URL dengan protokol yang terjamin.
 */
function ensureProtocol(url, defaultProtocol) {
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
        return defaultProtocol + url;
    }
    return url;
}

/**
 * Melakukan logika pelacakan kunjungan halaman dan permintaan API.
 * @param {NextRequest} req Objek permintaan Next.js.
 */
async function performTracking(req) {
    try {
        const currentUrl = new URL(req.url);
        const currentPathname = currentUrl.pathname;
        const baseURL = ensureProtocol(DOMAIN_URL, DEFAULT_PROTOCOL);

        const isApiRoute = currentPathname.startsWith("/api");
        const isVisitorApi = currentPathname.includes("/api/visitor");
        const isAuthApi = currentPathname.includes("/api/auth");
        const isGeneralApi = currentPathname.includes("/api/general");
        const isAuthPage = currentPathname === "/login" || currentPathname === "/register";

        // Hanya lacak permintaan API yang bukan API visitor, auth, atau general
        if (isApiRoute && !isVisitorApi && !isAuthApi && !isGeneralApi) {
            console.log(`[Middleware-Tracking] Mengirim data permintaan API untuk tracking: ${currentPathname}`);
            await axiosInstance.get(`${baseURL}/api/visitor/req`);
        }
        // Hanya lacak kunjungan halaman yang bukan rute API dan bukan halaman autentikasi
        else if (!isApiRoute && !isAuthPage) {
            console.log(`[Middleware-Tracking] Mengirim data kunjungan halaman untuk tracking: ${currentPathname}`);
            await axiosInstance.get(`${baseURL}/api/visitor/visit`);
            await axiosInstance.post(`${baseURL}/api/visitor/info`, {
                route: currentPathname,
                time: new Date().toISOString(),
                hit: 1
            });
        }
    } catch (err) {
        const errorMessage = err.response ? `Status ${err.response.status}: ${err.response.data?.message || err.message}` : err.message;
        console.error(`[Middleware-Tracking] Gagal mencatat pengunjung untuk ${req.url}: ${errorMessage}`);
    }
}

// Header Kebijakan Keamanan Konten (Content Security Policy)
const cspHeader = `
    frame-ancestors 'none';
    block-all-mixed-content;
    upgrade-insecure-requests;
`;

/**
 * Fungsi middleware utama Next.js.
 * Mengelola autentikasi, pengalihan, pembatasan laju, dan header keamanan.
 * @param {NextRequest} req Objek permintaan Next.js.
 * @returns {NextResponse} Objek respons Next.js.
 */
export async function middleware(req) {
    const url = new URL(req.url);
    const {
        pathname
    } = url;
    const ipAddress = getClientIp(req);

    console.log(`[Middleware-Main] Menerima permintaan untuk: ${pathname} dari IP: ${ipAddress}`);
    // Log untuk memverifikasi NEXTAUTH_SECRET yang digunakan middleware
    console.log("[Middleware-Main] NEXTAUTH_SECRET (first 5 chars):", NEXTAUTH_SECRET ? NEXTAUTH_SECRET.substring(0, 5) + '...' : 'Not set');

    let response = NextResponse.next(); // Respons default: melanjutkan permintaan

    try {
        // Definisikan jenis-jenis jalur
        const isApiRoute = pathname.startsWith("/api");
        const isLoginRoute = pathname === "/login";
        const isRegisterRoute = pathname === "/register";
        const isAuthPage = isLoginRoute || isRegisterRoute;
        const isAnalyticsRoute = pathname === "/analytics"; // Contoh halaman yang dilindungi/dashboard utama
        const isRootRoute = pathname === "/";

        // Jalur API yang dianggap publik dan tidak memerlukan autentikasi atau rate limiting ketat
        const isVisitorApi = pathname.includes("/api/visitor");
        const isAuthApi = pathname.includes("/api/auth"); // Rute NextAuth.js (misalnya, /api/auth/signin, /api/auth/callback)
        const isGeneralApi = pathname.includes("/api/general"); // Rute API umum/publik lainnya

        // Coba mendapatkan token NextAuth.js dari permintaan.
        const nextAuthToken = await getToken({
            req: req,
            secret: NEXTAUTH_SECRET
        });

        // Log token untuk tujuan debugging.
        console.log("[Middleware-Main] nextAuthToken:", nextAuthToken);

        const isAuthenticated = !!nextAuthToken; // Konversi token menjadi boolean
        console.log(`[Middleware-Main] Pathname: ${pathname}, Autentikasi: ${isAuthenticated ? "Ya" : "Tidak"}`);

        // Setel header keamanan untuk semua respons.
        response.headers.set("X-Content-Type-Options", "nosniff");
        response.headers.set("X-Frame-Options", "DENY");
        response.headers.set("X-XSS-Protection", "1; mode=block");
        response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
        response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
        response.headers.set("Access-Control-Allow-Origin", "*");
        response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
        response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
        response.headers.set("Access-Control-Allow-Credentials", "true");
        response.headers.set("Content-Security-Policy", cspHeader.replace(/\s{2,}/g, " ").trim());
        console.log("[Middleware-Main] Header keamanan telah diatur.");

        // Terapkan pembatasan laju (rate limiting) untuk rute API yang relevan.
        if (isApiRoute && !isVisitorApi && !isAuthApi && !isGeneralApi) {
            console.log(`[Middleware-RateLimit] Menerapkan Rate Limiting untuk API: ${pathname}`);
            try {
                const rateLimiterRes = await rateLimiter.consume(ipAddress, 1);
                response.headers.set("X-RateLimit-Limit", apiConfig.LIMIT_POINTS);
                response.headers.set("X-RateLimit-Remaining", rateLimiterRes.remainingPoints);
                response.headers.set("X-RateLimit-Reset", Math.ceil((Date.now() + rateLimiterRes.msBeforeNext) / 1e3));
                console.log(`[Middleware-RateLimit] Rate limit berhasil. Sisa permintaan: ${rateLimiterRes.remainingPoints}`);
            } catch (rateLimiterError) {
                const retryAfterSeconds = Math.ceil(rateLimiterError.msBeforeNext / 1e3);
                const totalLimit = apiConfig.LIMIT_POINTS;
                console.warn(`[Middleware-RateLimit] Rate limit terlampaui untuk IP: ${ipAddress}. Coba lagi dalam ${retryAfterSeconds} detik.`);
                // Buat respons error dengan header keamanan yang lengkap
                const errorResponse = new NextResponse(JSON.stringify({
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
                        "X-RateLimit-Reset": Math.ceil((Date.now() + rateLimiterError.msBeforeNext) / 1e3).toString(),
                        "Content-Security-Policy": cspHeader.replace(/\s{2,}/g, " ").trim(),
                        "X-Content-Type-Options": "nosniff",
                        "X-Frame-Options": "DENY",
                        "X-XSS-Protection": "1; mode=block",
                        "Referrer-Policy": "strict-origin-when-cross-origin",
                        "Permissions-Policy": "camera=(), microphone=(), geolocation=()"
                    }
                });
                await performTracking(req); // Lakukan pelacakan sebelum mengembalikan respons error
                return errorResponse;
            }
        }

        const redirectUrlWithProtocol = ensureProtocol(DOMAIN_URL, DEFAULT_PROTOCOL);

        // --- Logika Autentikasi dan Pengalihan ---
        if (isAuthenticated) {
            // Jika pengguna sudah terautentikasi:
            // 1. Cegah akses ke halaman login/register.
            if (isAuthPage) {
                console.log(`[Middleware-Auth] Pengguna terautentikasi mencoba mengakses halaman otentikasi (${pathname}). Mengarahkan ke /analytics.`);
                await performTracking(req); // Lakukan pelacakan sebelum pengalihan
                return NextResponse.redirect(`${redirectUrlWithProtocol}/analytics`);
            }
            // 2. Jika pengguna terautentikasi dan mencoba mengakses halaman root ('/'),
            //    maka alihkan ke /analytics (sesuai permintaan Anda untuk mengikuti kode yang diberikan).
            else if (isRootRoute) {
                console.log(`[Middleware-Auth] Pengguna terautentikasi mengakses halaman home (/). Mengarahkan ke /analytics.`);
                await performTracking(req); // Lakukan pelacakan sebelum pengalihan
                return NextResponse.redirect(`${redirectUrlWithProtocol}/analytics`);
            }
            // 3. Untuk semua jalur lain yang tidak termasuk di atas, izinkan akses jika terautentikasi.
            console.log(`[Middleware-Auth] Pengguna terautentikasi melanjutkan ke ${pathname}.`);
            await performTracking(req); // Lakukan pelacakan
            return response; // Lanjutkan ke halaman yang diminta
        } else {
            // Jika pengguna TIDAK terautentikasi:
            // Definisikan jalur yang dapat diakses publik (tanpa autentikasi).
            const isPublicPath = isAuthPage || isVisitorApi || isAuthApi || isGeneralApi;

            if (!isPublicPath) {
                // Jika jalur yang diminta BUKAN jalur publik (termasuk '/')
                // DAN pengguna tidak terautentikasi, alihkan ke halaman login.
                console.log(`[Middleware-Auth] Pengguna belum terautentikasi mencoba mengakses ${pathname}. Mengarahkan ke /login.`);
                await performTracking(req); // Lakukan pelacakan sebelum pengalihan
                return NextResponse.redirect(`${redirectUrlWithProtocol}/login`);
            }
            // Jika jalur yang diminta adalah jalur publik (login/register/API publik)
            // DAN pengguna tidak terautentikasi, izinkan akses.
            console.log(`[Middleware-Auth] Pengguna belum terautentikasi melanjutkan ke ${pathname}.`);
            await performTracking(req); // Lakukan pelacakan
            return response; // Izinkan akses ke halaman publik
        }
    } catch (error) {
        // Tangani kesalahan tak terduga dalam middleware.
        console.error("[Middleware-Error] Kesalahan tidak tertangani:", error);
        // Buat respons error dengan header keamanan yang lengkap
        const errorResponse = new NextResponse(JSON.stringify({
            status: "error",
            code: 500,
            message: "Kesalahan Server Internal"
        }), {
            status: 500,
            headers: {
                "Content-Type": "application/json",
                "Content-Security-Policy": cspHeader.replace(/\s{2,}/g, " ").trim(),
                "X-Content-Type-Options": "nosniff",
                "X-Frame-Options": "DENY",
                "X-XSS-Protection": "1; mode=block",
                "Referrer-Policy": "strict-origin-when-cross-origin",
                "Permissions-Policy": "camera=(), microphone=(), geolocation=()"
            }
        });
        // Tidak memanggil performTracking di sini karena ini adalah error tak terduga
        return errorResponse;
    }
}
