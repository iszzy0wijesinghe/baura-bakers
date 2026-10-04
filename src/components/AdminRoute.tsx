/** @format */

import type { ReactNode } from "react";
import {
  Navigate,
  useLocation,
} from "react-router-dom";

import BakingLoader from "./BakingLoader";
import { useAuthSession } from "../lib/useAuthSession";

type AdminRouteProps = {
  children: ReactNode;
  permission?: string;
};

export default function AdminRoute({
  children,
  permission,
}: AdminRouteProps) {
  const location = useLocation();

  const {
    user,
    isLoading,
    isActive,
    canAccessWebsiteAdmin,
    hasPermission,
  } = useAuthSession();

  if (isLoading) {
    return <BakingLoader />;
  }

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from:
            location.pathname +
            location.search,
        }}
      />
    );
  }

  if (
    !isActive ||
    !canAccessWebsiteAdmin
  ) {
    return (
      <Navigate
        to="/403"
        replace
      />
    );
  }

  if (
    permission &&
    !hasPermission(permission)
  ) {
    return (
      <Navigate
        to="/403"
        replace
      />
    );
  }

  return <>{children}</>;
}