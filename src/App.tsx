// src/App.tsx
import { RouterProvider } from "react-router-dom";
import { router } from "./app/router"; // adjust path to your router file

export default function App() {
  return <RouterProvider router={router} />;
}
