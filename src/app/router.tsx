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
import AdminOrders from "../pages/AdminOrders";
import AdminDashboard from "../pages/AdminDashboard";

export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      { path: "/menu", element: <Menu /> },
      { path: "/login", element: <Login /> },
      { path: "/register", element: <Register /> },
      { path: "/account", element: <Account /> },
      { path: "/", element: <Home /> },
      { path: "/menu/:slug", element: <ProductDetails /> },
      { path: "/cart", element: <Cart /> },
      { path: "/order", element: <Order /> },
      { path: "/contact", element: <Contact /> },
      { path: "/about-us", element: <About /> },
      { path: "/payment-success", element: <PaymentSuccess /> },
      { path: "/payment-cancelled", element: <PaymentCancelled /> },
      { path: "/orders", element: <OrderHistory /> },

      { path: "/admin/dashboard", element: <AdminDashboard /> },
      { path: "/admin/orders", element: <AdminOrders /> },
    ],
  },
]);
