import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../../core/Auth";
import instance from "../../../utils/axiosInstance-cookie-only";

export const useMyServicesData = (currentPage, pageSize) => {
  const authContext = useContext(AuthContext) || {};
  const currentUser = authContext?.currentUser || null;
  const queryClient = useQueryClient();

  const { data: userData, isLoading } = useQuery({
    queryKey: ["myServices", currentUser?._id, currentPage, pageSize],
    queryFn: async () => {
      if (!currentUser?._id) return null;
      const response = await instance.get(`/user/${currentUser?._id}/services`, {
        params: {
          page: currentPage,
          limit: pageSize,
        },
      });
      return response?.data;
    },
    enabled: !!currentUser?._id,
  });

  const { data: servicesWithLinksData, isLoading: isLoadingServicesWithLinks } = useQuery({
    queryKey: ["servicesWithLinks", currentUser?._id],
    queryFn: async () => {
      if (!currentUser?._id) return null;
      const response = await instance.get(`/user/${currentUser?._id}/services`, {
        params: {
          page: 1,
          limit: 1000,
        },
      });
      return response?.data;
    },
    enabled: !!currentUser?._id,
  });

  return {
    userData,
    servicesWithLinksData,
    isLoading: isLoading || isLoadingServicesWithLinks,
    currentUser,
    queryClient
  };
};

export const useActiveServices = (userData) => {
  const [activeServices, setActiveServices] = useState(new Set());

  useEffect(() => {
    if (!userData?.data?.services) return;

    const newActiveServices = new Set();
    userData.data.services.forEach(service => {
      const currentPercent = service.webhookData?.current_percent || service.autoUpdate?.current_percent || 0;
      if (currentPercent > 0 && currentPercent < 100) {
        newActiveServices.add(service._id);
      }
    });

    setActiveServices(newActiveServices);
  }, [userData]);

  return activeServices;
};

export const useRealtimePolling = (currentUser, queryClient, activeServices) => {
  const [isRealtimeUpdating, setIsRealtimeUpdating] = useState(false);

  useEffect(() => {
    if (!currentUser?._id || activeServices.size === 0) return;

    console.log('🚀 Starting realtime polling for', activeServices.size, 'active services');

    const pollInterval = setInterval(async () => {
      try {
        setIsRealtimeUpdating(true);
        console.log('🔄 Realtime polling: Refreshing data...');
        
        await queryClient.invalidateQueries({ 
          queryKey: ["myServices", currentUser._id],
          exact: false
        });
        await queryClient.invalidateQueries({ 
          queryKey: ["servicesWithLinks", currentUser._id],
          exact: false
        });
        
        setTimeout(() => setIsRealtimeUpdating(false), 500);
      } catch (error) {
        console.error('Error in realtime polling:', error);
        setIsRealtimeUpdating(false);
      }
    }, 2000);

    return () => {
      console.log('🛑 Stopping realtime polling');
      clearInterval(pollInterval);
    };
  }, [currentUser?._id, queryClient, activeServices.size]);

  return isRealtimeUpdating;
};
