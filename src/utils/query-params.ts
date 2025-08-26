/**
 * Utility functions for handling query parameters
 * Separated from hooks for better reusability
 */

export const logQueryParams = (params: Record<string, string>) => {
  if (Object.keys(params).length > 0) {
    console.log("🔍 Query parameters terdeteksi saat app start:", params);
    
    // Log specific parameters
    if (params.uuid) {
      console.log("📋 UUID parameter ditemukan:", params.uuid);
    }
  }
};

export const hasValidUuid = (uuid: string | null): boolean => {
  return Boolean(uuid && uuid.length > 0);
};