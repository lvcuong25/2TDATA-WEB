import { useQuery } from '@tanstack/react-query';
import axiosInstance from '../utils/axiosInstance';

export const useSiteFooter = () => {
  const { data: siteData } = useQuery({
    queryKey: ['site-info'],
    queryFn: async () => {
      const response = await axiosInstance.get('/sites/current');
      return response.data.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });

  return {
    footerConfig: siteData?.footer_config || null,
    isLoading: !siteData
  };
};
