// BroFocus - Google Sign-In Button
// Renders Google's official button via Identity Services and hands the raw
// ID token credential up to the caller. No @react-oauth/google dependency
// needed - this is the vanilla script approach, kept deliberately simple.
import React, { useEffect, useRef, useState } from 'react';
import { loadGoogleIdentityScript } from '../../lib/loadGoogleIdentityScript';

interface GoogleSignInButtonProps {
  onCredential: (credential: string) => void;
  onError: (message: string) => void;
}

export const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({ onCredential, onError }) => {
  const buttonRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;
    if (!clientId) {
      setLoading(false);
      onError('Google sign-in is not configured (missing VITE_GOOGLE_CLIENT_ID in the frontend .env).');
      return;
    }

    let cancelled = false;

    loadGoogleIdentityScript()
      .then(() => {
        if (cancelled || !window.google || !buttonRef.current) return;

        try {
          window.google.accounts.id.initialize({
            client_id: clientId,
            callback: (response) => onCredential(response.credential),
          });

          window.google.accounts.id.renderButton(buttonRef.current, {
            type: 'standard',
            theme: 'outline',
            size: 'large',
            shape: 'pill',
            text: 'continue_with',
            width: 280,
          });

          setLoading(false);
        } catch (error) {
          setLoading(false);
          onError(error instanceof Error ? error.message : 'Google sign-in could not be initialized.');
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLoading(false);
          onError('Could not load Google sign-in. Check your connection and try again.');
        }
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col items-center gap-2 min-h-[44px] justify-center">
      <div ref={buttonRef} />
      {loading && <p className="text-xs text-on-surface-variant">Loading Google sign-in…</p>}
    </div>
  );
};
