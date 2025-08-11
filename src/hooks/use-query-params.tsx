import { useLocation, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";

/**
 * Hook untuk menangkap query parameters saat aplikasi pertama dijalankan
 * Contoh penggunaan:
 * - ?uuid=123456 untuk iframe login
 * - ?redirect=/dashboard untuk redirect setelah login
 * - ?theme=dark untuk set theme
 */
export const useQueryParams = () => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const [initialParams, setInitialParams] = useState<Record<string, string>>({});

  // Capture semua query parameters saat pertama kali load
  useEffect(() => {
    const params: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      params[key] = value;
    });
    
    if (Object.keys(params).length > 0) {
      console.log("Query parameters detected:", params);
      setInitialParams(params);
    }
  }, []);

  // Helper functions untuk mendapatkan parameter spesifik
  const getParam = (key: string): string | null => {
    return searchParams.get(key);
  };

  const getUuid = (): string | null => {
    return getParam('uuid');
  };

  const getRedirect = (): string | null => {
    return getParam('redirect');
  };

  const getTheme = (): string | null => {
    return getParam('theme');
  };

  // Mendapatkan semua parameters sebagai object
  const getAllParams = (): Record<string, string> => {
    const params: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      params[key] = value;
    });
    return params;
  };

  return {
    searchParams,
    location,
    initialParams,
    getParam,
    getUuid,
    getRedirect, 
    getTheme,
    getAllParams,
    // Check if specific parameters exist
    hasUuid: () => !!getUuid(),
    hasRedirect: () => !!getRedirect(),
    hasTheme: () => !!getTheme(),
  };
};

/**
 * Hook sederhana untuk hanya mendapatkan UUID dari query parameter
 */
export const useUuidParam = () => {
  const { getUuid, hasUuid } = useQueryParams();
  
  return {
    uuid: getUuid(),
    hasUuid: hasUuid()
  };
};