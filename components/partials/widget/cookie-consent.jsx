"use client";

import { useState, useEffect } from "react";
import { ToastContainer, toast } from "react-toastify";
import { Icon } from "@iconify/react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

const CustomCookieConsent = () => {
  const [visible, setVisible] = useState(false);
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") {
      setVisible(false);
      return;
    }

    if (status === "authenticated") {
      setVisible(false);
      return;
    }

    if (status === "unauthenticated") {
      setTimeout(() => setVisible(true), 1000);
    }
  }, [status]);

  const acceptCookie = () => {
    toast.success("Anda menyetujui penggunaan cookie.");
    setVisible(false);
    router.push('/');
  };

  const declineCookie = () => {
    toast.info("Anda menolak penggunaan cookie non-esensial.");
    setVisible(false);
    router.push('/login');
  };

  if (!visible) return null;

  return (
    <>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        newestOnTop
        theme="colored"
        toastClassName={(options) =>
          `relative flex p-1 min-h-10 rounded-md justify-between overflow-hidden cursor-pointer
           ${options?.type === 'success' ? 'bg-emerald-500 text-white' :
             options?.type === 'error' ? 'bg-red-500 text-white' :
             options?.type === 'warn' ? 'bg-yellow-500 text-white' :
             'bg-sky-500 text-white'} dark:text-slate-100 text-sm p-3 m-2 rounded-lg shadow-md`
        }
      />

      {/* Overlay background */}
      <div className="fixed inset-0 z-[9998] bg-slate-900/50 backdrop-blur-sm" />

      {/* Cookie consent box centered */}
      <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4">
        <div className="w-full max-w-4xl border border-teal-500/50 dark:border-teal-600/70 rounded-xl shadow-lg bg-white text-slate-800 dark:bg-slate-800/50 dark:text-slate-100 backdrop-blur-sm bg-opacity-80 dark:bg-opacity-80 p-4 sm:p-6">
          <div className="flex items-start space-x-3">
            <Icon icon="ph:cookie-duotone" className="text-4xl text-teal-500 flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <h2 className="font-bold text-xl text-teal-600 dark:text-teal-300">Penggunaan Cookie di Situs Kami</h2>
              <p className="text-sm sm:text-base">
                Situs ini menggunakan cookie untuk meningkatkan pengalaman Anda. Cookie esensial diperlukan untuk fungsi dasar situs. Cookie non-esensial digunakan untuk analitik dan personalisasi.
                <br />
                Apakah Anda menyetujui penggunaan semua cookie?
              </p>

              {status === "loading" && <p className="text-xs text-slate-500 dark:text-slate-400">Memuat sesi...</p>}
              {session && (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Sesi pengguna: {session.user.email} (Status: {status})
                </p>
              )}
              {!session && status === "unauthenticated" && (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Anda belum login. Untuk melanjutkan, harap setujui penggunaan cookie.
                </p>
              )}

              <div className="mt-4 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={acceptCookie}
                  className="w-full sm:w-auto bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white font-semibold rounded-md shadow-md hover:shadow-lg transition duration-300 py-2.5 px-5 text-sm flex items-center justify-center"
                >
                  <Icon icon="ph:check-circle-duotone" className="mr-2 text-base" />
                  Ya, Saya Setuju
                </button>
                <button
                  onClick={declineCookie}
                  className="w-full sm:w-auto bg-slate-200 hover:bg-slate-300 dark:bg-slate-600 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold rounded-md shadow-md hover:shadow-lg transition duration-300 py-2.5 px-5 text-sm flex items-center justify-center"
                >
                  <Icon icon="ph:x-circle-duotone" className="mr-2 text-base" />
                  Tidak, Terima Kasih
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CustomCookieConsent;
