/**
 * Get the base API URL based on development flag
 */
export const getBaseUrl = (): string => {
  // Check if we're in development mode based on ISDEV flag
  const isDev = import.meta.env.VITE_ISDEV === 'true';
  
  if (isDev) {
    return 'http://localhost:8282';
  }
  
  return 'https://digio.pgn.co.id/lisa_backend';
};

/**
 * Base URL for API calls
 */
export const BASE_URL = getBaseUrl();