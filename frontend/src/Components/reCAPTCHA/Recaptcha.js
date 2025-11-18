import { useEffect, useRef, useState } from 'react';

const Recaptcha = ({ onVerify, siteKey, theme = 'light', size = 'normal' }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isExpired, setIsExpired] = useState(false);
  const captchaRef = useRef(null);
  const widgetId = useRef(null);

  useEffect(() => {
    // Check if reCAPTCHA script is already loaded
    if (window.grecaptcha) {
      setIsLoaded(true);
      return;
    }

    // Load reCAPTCHA script if not already loaded
    const script = document.createElement('script');
    script.src = 'https://www.google.com/recaptcha/api.js?onload=onRecaptchaLoad&render=explicit';
    script.async = true;
    script.defer = true;
    
    window.onRecaptchaLoad = () => {
      setIsLoaded(true);
    };

    document.head.appendChild(script);

    return () => {
      // Cleanup
      document.head.removeChild(script);
      if (window.onRecaptchaLoad) {
        delete window.onRecaptchaLoad;
      }
    };
  }, []);

  useEffect(() => {
    if (isLoaded && captchaRef.current && !widgetId.current) {
      // Render the reCAPTCHA widget
      widgetId.current = window.grecaptcha.render(captchaRef.current, {
        sitekey: siteKey || process.env.REACT_APP_RECAPTCHA_SITE_KEY,
        theme: theme,
        size: size,
        callback: (response) => {
          onVerify(response);
          setIsExpired(false);
        },
        'expired-callback': () => {
          setIsExpired(true);
          onVerify(null);
        },
        'error-callback': () => {
          setIsExpired(true);
          onVerify(null);
        }
      });
    }
  }, [isLoaded, siteKey, theme, size, onVerify]);

  const handleReset = () => {
    if (window.grecaptcha && widgetId.current) {
      window.grecaptcha.reset(widgetId.current);
      setIsExpired(false);
    }
  };

  // Show loading state while reCAPTCHA is not loaded
  if (!isLoaded) {
    return (
      <div className="flex justify-center items-center h-20 bg-gray-100 rounded">
        <div className="text-gray-500">Loading reCAPTCHA...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      <div ref={captchaRef}></div>
      {isExpired && (
        <button
          type="button"
          onClick={handleReset}
          className="mt-2 text-sm text-blue-600 hover:text-blue-800 underline"
        >
          Reset reCAPTCHA
        </button>
      )}
    </div>
  );
};

export default Recaptcha;