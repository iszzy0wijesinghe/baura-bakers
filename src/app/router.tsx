/** @format */

import { createBrowserRouter } from "react-router-dom";
import AppLayout from "../components/AppLayout";
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
import AdminOrders from "../pages/AdminOrders";
import AdminDashboard from "../pages/AdminDashboard";
import ComingSoonPage from "../pages/system/ComingSoonPage";
import CriticalBreakPage from "../pages/system/CriticalBreakPage";
import ErrorStatusPage from "../pages/system/ErrorStatusPage";
import MaintenancePage from "../pages/system/MaintenancePage";

export const router = createBrowserRouter([
  // isolated system pages
  { path: "/coming-soon", element: <ComingSoonPage /> },
  { path: "/site-maintenance", element: <MaintenancePage /> },
  { path: "/critical-break", element: <CriticalBreakPage /> },

  // isolated error pages
  { path: "/400", element: <ErrorStatusPage statusCode={400} /> },
  { path: "/401", element: <ErrorStatusPage statusCode={401} /> },
  { path: "/403", element: <ErrorStatusPage statusCode={403} /> },
  { path: "/404", element: <ErrorStatusPage statusCode={404} /> },
  { path: "/500", element: <ErrorStatusPage statusCode={500} /> },
  { path: "/server-error", element: <ErrorStatusPage statusCode={500} /> },

  // normal website layout
  {
    element: <AppLayout />,
    errorElement: <ErrorStatusPage statusCode={500} />,
    children: [
      { path: "/", element: <Home /> },
      { path: "/menu", element: <Menu /> },
      { path: "/menu/:slug", element: <ProductDetails /> },
      { path: "/cart", element: <Cart /> },
      { path: "/order", element: <Order /> },
      { path: "/contact", element: <Contact /> },
      { path: "/about-us", element: <About /> },
      { path: "/payment-success", element: <PaymentSuccess /> },
      { path: "/payment-cancelled", element: <PaymentCancelled /> },
      { path: "/login", element: <Login /> },
      { path: "/register", element: <Register /> },
      { path: "/account", element: <Account /> },
      { path: "/orders", element: <OrderHistory /> },
      { path: "/receipt/:orderNo", element: <Receipt /> },
      { path: "/admin/dashboard", element: <AdminDashboard /> },
      { path: "/admin/orders", element: <AdminOrders /> },
    ],
  },

  // unknown pages isolated
  { path: "*", element: <ErrorStatusPage statusCode={404} /> },
]);