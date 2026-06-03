import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { CartProvider } from "./app/cart";
import { router } from "./app/router";
import AppErrorBoundary from "./components/AppErrorBoundary";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AppErrorBoundary>
      <CartProvider>
        <RouterProvider router={router} />
      </CartProvider>
    </AppErrorBoundary>
  </React.StrictMode>,
);