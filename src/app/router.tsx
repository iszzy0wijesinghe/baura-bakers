import { createBrowserRouter } from "react-router-dom";
import AppLayout from "../components/AppLayout";
import Home from "../pages/Home";
import Menu from "../pages/Menu";
import ProductDetails from "../pages/ProductDetails";
import Cart from "../pages/Cart";
import Order from "../pages/Order";
import Contact from "../pages/Contact";
import About from "../pages/About";

export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      { path: "/", element: <Home /> },
      { path: "/menu", element: <Menu /> },
      { path: "/menu/:slug", element: <ProductDetails /> },
      { path: "/cart", element: <Cart /> },
      { path: "/order", element: <Order /> },
      { path: "/contact", element: <Contact /> },
      { path: "/about-us", element: <About /> },
    ],
  },
]);
