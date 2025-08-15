import { useContext } from "react";
import { Navigate, useLocation } from "react-router";
import { AuthContext } from "../components/core/Auth";

const ConditionalRoute = ({ condition, redirectTo, children }) => {
  return condition ? children : <Navigate to={redirectTo} />;
};

const LoginRoute = ({ children }) => {
  const authContext = useContext(AuthContext) || {};
  const currentUser = authContext?.currentUser || null;
  
  return (
    <ConditionalRoute
      condition={!!(currentUser && currentUser._id)}
      redirectTo="/?openform=true"
      children={children}
    />
  );
};

const NoneLoginRoute = ({ children }) => {
  const authContext = useContext(AuthContext) || {};
  const currentUser = authContext?.currentUser || null;
  return (
    <ConditionalRoute
      condition={!currentUser}
      redirectTo="/"
      children={children}
    />
  );
};

const AdminRoute = ({ children }) => {
  const authContext = useContext(AuthContext) || {};
  const currentUser = authContext?.currentUser || null;
  const isLoading = authContext?.isLoading || false;
  const isAdmin = authContext?.isAdmin || false;
  
  // Nếu đang loading, hiển thị loading hoặc đợi
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }
  
  // Add comprehensive safety check for currentUser
  if (!currentUser || !currentUser._id || !currentUser.role) {
    return <Navigate to="/signin" />;
  }
  
  return (
    <ConditionalRoute
      condition={!!(currentUser && currentUser._id && isAdmin)}
      redirectTo="/signin"
      children={children}
    />
  );
};

const IframeAdminRoute = ({ children }) => {
  const authContext = useContext(AuthContext) || {};
  const currentUser = authContext?.currentUser || null;
  const isLoading = authContext?.isLoading || false;
  const location = useLocation();
  
  // Nếu đang loading, hiển thị loading hoặc đợi
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }
  
  // Add comprehensive safety check for currentUser
  if (!currentUser || !currentUser._id || !currentUser.role) {
    console.log('IframeAdminRoute: Invalid user data, redirecting to signin');
    return <Navigate to={`/signin?redirect=${encodeURIComponent(location.pathname)}`} />;
  }
  
  // Chỉ cho phép site_admin và super_admin truy cập
  const allowedRoles = ["site_admin", "super_admin"];
  const hasValidRole = currentUser.role && allowedRoles.includes(currentUser.role);
  
  console.log('IframeAdminRoute Debug:', {
    pathname: location.pathname,
    currentUser: currentUser ? { _id: currentUser._id, role: currentUser.role } : null,
    isLoading,
    hasValidRole,
    allowedRoles
  });
  
  return (
    <ConditionalRoute
      condition={!!(currentUser && currentUser._id && hasValidRole)}
      redirectTo={`/signin?redirect=${encodeURIComponent(location.pathname)}`}
      children={children}
    />
  );
};

const PrivateRoute = ({ children }) => {
  const authContext = useContext(AuthContext) || {};
  const currentUser = authContext?.currentUser || null;
  const isLoading = authContext?.isLoading || false;
  const location = useLocation();
  
  // Nếu đang loading, hiển thị loading hoặc đợi
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }
  
  return (
    <ConditionalRoute
      condition={!!(currentUser && currentUser._id)}
      redirectTo={`/signin?redirect=${encodeURIComponent(location.pathname)}`}
      children={children}
    />
  );
};

const SuperAdminRoute = ({ children }) => {
  const authContext = useContext(AuthContext) || {};
  const currentUser = authContext?.currentUser || null;
  const isLoading = authContext?.isLoading || false;
  const isSuperAdmin = authContext?.isSuperAdmin || false;
  const location = useLocation();
  
  console.log('SuperAdminRoute Debug:', {
    pathname: location.pathname,
    currentUser: currentUser ? { _id: currentUser._id, role: currentUser.role } : null,
    isLoading,
    isSuperAdmin,
    hasValidUser: !!(currentUser && currentUser._id && currentUser.role)
  });
  
  // Nếu đang loading, hiển thị loading hoặc đợi
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }
  
  // Add comprehensive safety check for currentUser
  if (!currentUser || !currentUser._id || !currentUser.role) {
    console.log('SuperAdminRoute: Invalid user data, redirecting to signin');
    return <Navigate to={`/signin?redirect=${encodeURIComponent(location.pathname)}`} />;
  }
  
  // Additional safety check for super admin role
  const validSuperAdminRoles = ["super_admin"];
  const hasValidRole = currentUser.role && validSuperAdminRoles.includes(currentUser.role);
  
  return (
    <ConditionalRoute
      condition={!!(currentUser && currentUser._id && hasValidRole)}
      redirectTo={`/signin?redirect=${encodeURIComponent(location.pathname)}`}
      children={children}
    />
  );
};

export { LoginRoute, NoneLoginRoute, AdminRoute, IframeAdminRoute, PrivateRoute, SuperAdminRoute };
