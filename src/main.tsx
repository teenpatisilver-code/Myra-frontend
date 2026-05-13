import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Supabase is configured via environment variables in src/lib/supabase.ts
// No need to set base URL anymore

createRoot(document.getElementById("root")!).render(<App />);
