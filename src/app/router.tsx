/** @format */

import { createBrowserRouter } from "react-router-dom";

import AppLayout from "../components/AppLayout";
import AdminRoute from "../components/AdminRoute";

import Home from "../pages/Home";
import Menu from "../pages/Menu";
import ProductDetails from "../pages/ProductDetails";
import Cart from "../pages/Cart";
import Order from "../pages/Order";
import Contact from "../pages/Contact";
import About from "../pages/About";
import PaymentSuccess from "../pages/PaymentSuccess";
import PaymentCancelled from "../pages/PaymentCancelled";
import Login from "../pages/Login";
import Register from "../pages/Register";
import Account from "../pages/Account";
import OrderHistory from "../pages/OrderHistory";
import Receipt from "../pages/Receipt";
import OrderTracking from "../pages/OrderTracking";

import AdminDashboard from "../pages/AdminDashboard";
import AdminOrders from "../pages/AdminOrders";
import AdminProducts from "../pages/AdminProducts";
import AdminHeroSlides from "../pages/AdminHeroSlides";
import AdminPromotions from "../pages/AdminPromotions";
import AdminDeliveryManagement from "../pages/AdminDeliveryManagement";
import AdminSiteSettings from "../pages/AdminSiteSettings";
import AdminUsers from "../pages/AdminUsers";
import AdminAccessManagement from "../pages/AdminAccessManagement";

import ComingSoonPage from "../pages/system/ComingSoonPage";
import CriticalBreakPage from "../pages/system/CriticalBreakPage";
import ErrorStatusPage from "../pages/system/ErrorStatusPage";
import MaintenancePage from "../pages/system/MaintenancePage";

export const router = createBrowserRouter([
  /*
    |--------------------------------------------------------------------------
    | Isolated system pages
    |--------------------------------------------------------------------------
    */

  {
    path: "/coming-soon",
    element: <ComingSoonPage />,
  },

  {
    path: "/site-maintenance",
    element: <MaintenancePage />,
  },

  {
    path: "/critical-break",
    element: <CriticalBreakPage />,
  },

  {
    path: "/track/:orderNo",
    element: <OrderTracking />,
  },

  /*
    |--------------------------------------------------------------------------
    | Isolated error pages
    |--------------------------------------------------------------------------
    */

  {
    path: "/400",
    element: <ErrorStatusPage statusCode={400} />,
  },

  {
    path: "/401",
    element: <ErrorStatusPage statusCode={401} />,
  },

  {
    path: "/403",
    element: <ErrorStatusPage statusCode={403} />,
  },

  {
    path: "/404",
    element: <ErrorStatusPage statusCode={404} />,
  },

  {
    path: "/500",
    element: <ErrorStatusPage statusCode={500} />,
  },

  {
    path: "/server-error",
    element: <ErrorStatusPage statusCode={500} />,
  },

  /*
    |--------------------------------------------------------------------------
    | Website
    |--------------------------------------------------------------------------
    */

  {
    element: <AppLayout />,

    errorElement: <ErrorStatusPage statusCode={500} />,

    children: [
      {
        path: "/",
        element: <Home />,
      },

      {
        path: "/menu",
        element: <Menu />,
      },

      {
        path: "/menu/:slug",
        element: <ProductDetails />,
      },

      {
        path: "/cart",
        element: <Cart />,
      },

      {
        path: "/order",
        element: <Order />,
      },

      {
        path: "/contact",
        element: <Contact />,
      },

      {
        path: "/about-us",
        element: <About />,
      },

      {
        path: "/payment-success",
        element: <PaymentSuccess />,
      },

      {
        path: "/payment-cancelled",
        element: <PaymentCancelled />,
      },

      {
        path: "/login",
        element: <Login />,
      },

      {
        path: "/register",
        element: <Register />,
      },

      {
        path: "/account",
        element: <Account />,
      },

      {
        path: "/orders",
        element: <OrderHistory />,
      },

      {
        path: "/receipt/:orderNo",
        element: <Receipt />,
      },

      /*
        |--------------------------------------------------------------------------
        | Website administration
        |--------------------------------------------------------------------------
        |
        | These checks control frontend routing/navigation.
        |
        | Laravel permission middleware remains the authoritative
        | security boundary for every protected API operation.
        |
        */

      {
        path: "/admin/dashboard",

        element: (
          <AdminRoute>
            <AdminDashboard />
          </AdminRoute>
        ),
      },

      {
        path: "/admin/orders",

        element: (
          <AdminRoute permission="website-admin.orders.manage">
            <AdminOrders />
          </AdminRoute>
        ),
      },

      {
        path: "/admin/products",

        element: (
          <AdminRoute permission="website-admin.catalog.manage">
            <AdminProducts />
          </AdminRoute>
        ),
      },

      {
        path: "/admin/promotions",

        element: (
          <AdminRoute permission="website-admin.promotions.manage">
            <AdminPromotions />
          </AdminRoute>
        ),
      },

      {
        path: "/admin/delivery",

        element: (
          <AdminRoute permission="website-admin.delivery.manage">
            <AdminDeliveryManagement />
          </AdminRoute>
        ),
      },

      {
        path: "/admin/site-settings",

        element: (
          <AdminRoute permission="website-admin.site-mode.manage">
            <AdminSiteSettings />
          </AdminRoute>
        ),
      },

      {
        path: "/admin/hero-slides",

        element: (
          <AdminRoute permission="website-admin.hero-slides.manage">
            <AdminHeroSlides />
          </AdminRoute>
        ),
      },

      {
        path: "/admin/users",

        element: (
          <AdminRoute permission="website-admin.users.manage">
            <AdminUsers />
          </AdminRoute>
        ),
      },

      {
        path: "/admin/access",

        element: (
          <AdminRoute permission="website-admin.permission-profiles.manage">
            <AdminAccessManagement />
          </AdminRoute>
        ),
      },
    ],
  },

  /*
    |--------------------------------------------------------------------------
    | Unknown routes
    |--------------------------------------------------------------------------
    */

  {
    path: "*",

    element: <ErrorStatusPage statusCode={404} />,
  },
]);