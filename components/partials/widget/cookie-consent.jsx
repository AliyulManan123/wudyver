"use client";

import { useState, useEffect } from "react";
import Cookies from "js-cookie";
import { ToastContainer, toast } from "react-toastify";
import { Icon } from "@iconify/react";

const CustomCookieConsent = () => {
  const [visible, setVisible] = useState(false);
  const cookieName = "wudysoft_cookie_consent";

  useEffect(() => {
    const consent = Cookies.get(cookieName);
    if (!consent) {
      setTimeout(() => setVisible(true), 1000); // delay tampil 1s
    }
  }, []);

  const acceptCookie = () => {
    Cookies.set(cookieName, "true", { expires: 365 });
    toast.success("Anda menyetujui penggunaan cookie.");
    setVisible(false);
  };

  const declineCookie = () => {
    Cookies.set(cookieName, "false", { expires: 365 });
    toast.info("Anda menolak penggunaan cookie non-esensial.");
    setVisible(false);
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

      <div className="fixed inset-0 z-[9998] bg-slate-900/50 backdrop-blur-sm" />

      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-[9999] w-full max-w-4xl px-4">
        <div className="border border-teal-500/50 dark:border-teal-600/70 rounded-xl shadow-lg bg-white text-slate-800 dark:bg-slate-800/50 dark:text-slate-100 backdrop-blur-sm bg-opacity-80 dark:bg-opacity-80 p-4 sm:p-6">
          <div className="flex items-start space-x-3">
            <Icon icon="ph:cookie-duotone" className="text-3xl text-teal-500 flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <h2 className="font-semibold text-lg text-teal-600 dark:text-teal-300">Persetujuan Cookie</h2>
              <p className="text-sm sm:text-base">
                Situs ini menggunakan cookie untuk meningkatkan pengalaman Anda. Cookie esensial diperlukan untuk fungsi dasar situs. Cookie non-esensial digunakan untuk analitik dan personalisasi.
                <br />
                Apakah Anda menyetujui penggunaan semua cookie?
              </p>
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
