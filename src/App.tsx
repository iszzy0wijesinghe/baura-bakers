import { useEffect } from "react";
import { RouterProvider } from "react-router-dom";
import { router } from "./app/router";
import { supabase } from "./lib/supabase";

export default function App() {
  useEffect(() => {
    console.log("App loaded. Testing Supabase...");

    async function testSupabase() {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .limit(5);

      console.log("Supabase test data:", data);
      console.log("Supabase test error:", error);
    }

    testSupabase();
  }, []);

  return <RouterProvider router={router} />;
}

// import { RouterProvider } from "react-router-dom";
// import { router } from "./app/router";

// export default function App() {
//   return <RouterProvider router={router} />;
// }
