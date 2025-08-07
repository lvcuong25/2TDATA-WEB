import { useContext } from "react";
import { Navigate, useLocation } from "react-router";
import { AuthContext } from "../components/core/Auth";

const ConditionalRoute = ({ condition, redirectTo, children }) => {
  return condition ? children : <Navigate to={redirectTo} />;
};

const LoginRoute = ({ children }) => {
  const { currentUser } = useContext(AuthContext);
  const hasToken = localStorage.getItem('accessToken');
  
  return (
    <ConditionalRoute
      condition={!!currentUser && hasToken}
      redirectTo="/?openform=true"
      children={children}
    />
  );
};

const NoneLoginRoute = ({ children }) => {
  const { currentUser } = useContext(AuthContext);
  return (
    <ConditionalRoute
      condition={!currentUser}
      redirectTo="/"
      children={children}
    />
  );
};

const AdminRoute = ({ children }) => {
  const { currentUser } = useContext(AuthContext);
  const isAdmin = currentUser?.role === "admin" || currentUser?.role === "super_admin" || currentUser?.role === "superadmin" || currentUser?.role === "site_admin";
  const hasToken = localStorage.getItem('accessToken');
  
  return (
    <ConditionalRoute
      condition={!!currentUser && isAdmin && hasToken}
      redirectTo="/"
      children={children}
    />
  );
};

const PrivateRoute = ({ children }) => {
  const { currentUser } = useContext(AuthContext);
  const location = useLocation();
  
  // Check if user has token but no currentUser (might be deactivated)
  const hasToken = localStorage.getItem('accessToken');
  
  return (
    <ConditionalRoute
      condition={!!currentUser && hasToken}
      redirectTo={`${location.pathname}`}
      children={children}
    />
  );
};

const SuperAdminRoute = ({ children }) => {
  const { currentUser } = useContext(AuthContext);
  const isSuperAdmin = currentUser?.role === "super_admin" || currentUser?.role === "superadmin";
  const hasToken = localStorage.getItem('accessToken');
  
  return (
    <ConditionalRoute
      condition={!!currentUser && isSuperAdmin && hasToken}
      redirectTo="/admin"
      children={children}
    />
  );
};

export { LoginRoute, NoneLoginRoute, AdminRoute, PrivateRoute, SuperAdminRoute };
