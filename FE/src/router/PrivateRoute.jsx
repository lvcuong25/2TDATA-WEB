import { useContext } from "react";
import { Navigate, useLocation } from "react-router";
import { AuthContext } from "../components/core/Auth";


const ConditionalRoute = ({ condition, redirectTo, children }) => {
  return condition ? children : <Navigate to={redirectTo} />;
};

const LoginRoute = ({ children }) => {
  const { currentUser } = useContext(AuthContext);
  return (
    <ConditionalRoute
      condition={!!currentUser}
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
  const isAdmin = currentUser?.role === "admin";
  return (
    <ConditionalRoute
      condition={!!currentUser && isAdmin}
      redirectTo="/"
      children={children}
    />
  );
};

const PrivateRoute = ({ children }) => {
  const { currentUser } = useContext(AuthContext);
  const location = useLocation();
  
  return (
    <ConditionalRoute
      condition={!!currentUser}
      redirectTo={`${location.pathname}`}
      children={children}
    />
  );
};

export { LoginRoute, NoneLoginRoute, AdminRoute, PrivateRoute };
