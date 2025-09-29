import { useQuery } from '@tanstack/react-query';
import axiosInstance from '../utils/axiosInstance';

export const useSiteFooter = () => {
  const { data: siteData, isLoading, error } = useQuery({
    queryKey: ['site-info'],
    queryFn: async () => {
      try {
        const response = await axiosInstance.get('/sites/current');
        return response.data.data;
      } catch (error) {
        console.error('Error fetching site info:', error);
        return null;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (renamed from cacheTime in v5)
    retry: 1, // Only retry once on failure
    enabled: true, // Ensure the query is enabled
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  return {
    footerConfig: siteData?.footer_config || null,
    isLoading: isLoading || false,
    error: error || null
  };
};
