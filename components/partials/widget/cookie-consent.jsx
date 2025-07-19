"use client";

import CookieConsent from "react-cookie-consent";
import { ToastContainer, toast } from "react-toastify";
import { Icon } from '@iconify/react';
import Card from "@/components/ui/Card";

const CustomCookieConsent = () => {
  const handleAcceptCookie = (acceptedByScrolling) => {
    if (acceptedByScrolling) {
      toast.success("Anda menyetujui penggunaan cookie melalui gulir halaman!");
    } else {
      toast.success("Anda menyetujui penggunaan cookie.");
    }
  };

  const handleDeclineCookie = () => {
    toast.info("Anda menolak penggunaan cookie non-esensial.");
  };

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

      <CookieConsent
        location="bottom"
        buttonText="Ya, Saya Setuju"
        declineButtonText="Tidak, Terima Kasih"
        cookieName="wudysoft_cookie_consent"
        cookieValue={true}
        declineCookieValue={false}
        expires={365}
        enableDeclineButton
        flipButtons
        onAccept={handleAcceptCookie}
        onDecline={handleDeclineCookie}
        overlay

        containerClasses="w-full max-w-4xl mx-auto border border-teal-500/50 dark:border-teal-600/70 rounded-xl shadow-lg bg-white text-slate-800 dark:bg-slate-800/50 dark:text-slate-100 backdrop-blur-sm bg-opacity-80 dark:bg-opacity-80 p-4 sm:p-6 mb-4 flex flex-col sm:flex-row items-center justify-between gap-4"
        contentClasses="flex items-center text-sm md:text-base text-center sm:text-left"
        buttonWrapperClasses="flex flex-col sm:flex-row items-center gap-3"
        buttonClasses="flex-shrink-0 min-w-[140px] bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white font-semibold rounded-md shadow-md hover:shadow-lg transition duration-300 py-2.5 text-sm flex items-center justify-center disabled:opacity-70"
        declineButtonClasses="flex-shrink-0 min-w-[140px] bg-slate-200 hover:bg-slate-300 dark:bg-slate-600 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold rounded-md shadow-md hover:shadow-lg transition duration-300 py-2.5 text-sm flex items-center justify-center disabled:opacity-70"
        overlayClasses="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[9999]"
      >
        <div className="flex items-center space-x-3">
          <Icon icon="ph:cookie-duotone" className="text-3xl text-teal-500 flex-shrink-0" />
          <p>
            Situs web ini menggunakan cookie untuk meningkatkan pengalaman pengguna Anda. Beberapa cookie (seperti untuk login) sangat penting agar situs berfungsi. Cookie non-esensial digunakan untuk analitik dan personalisasi.
            <br />
            Apakah Anda setuju dengan penggunaan semua cookie ini?
          </p>
        </div>
      </CookieConsent>
    </>
  );
};

export default CustomCookieConsent;