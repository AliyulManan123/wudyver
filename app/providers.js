// app/providers.js
"use client"; // This component must be a Client Component

import { Provider as ReduxProvider } from "react-redux";
import { SessionProvider } from "next-auth/react"; // Crucial for NextAuth session context
import store from "../store"; // Adjust path to your Redux store
import { HelmetProvider } from 'react-helmet-async';
import DevtoolDetector from '@/components/DevtoolDetector';

// Import all global CSS files that are needed client-side
import "react-toastify/dist/ReactToastify.css";
import "simplebar-react/dist/simplebar.min.css";
import "flatpickr/dist/themes/light.css";
import "react-svg-map/lib/index.css";
import "leaflet/dist/leaflet.css";
import "./scss/app.scss"; // Adjust this path to your main SCSS/CSS file

/**
 * @param {Object} props - Component props.
 * @param {React.ReactNode} props.children - The child components to be wrapped by all providers.
 * @returns {JSX.Element} A component that provides various contexts to its children.
 */
export default function Providers({ children }) {
  return (
    // SessionProvider should wrap other providers to ensure session context is available early
    <SessionProvider>
      <HelmetProvider>
        {/* Redux Provider for state management */}
        <ReduxProvider store={store}>
          {/* DevtoolDetector for development purposes */}
          <DevtoolDetector />
          {children}
        </ReduxProvider>
      </HelmetProvider>
    </SessionProvider>
  );
}
