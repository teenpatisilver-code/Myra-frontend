import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { setBaseUrl } from "@/api";

// In production (Vercel), point the API client to the deployed backend.
// In development, Vite proxies /api → localhost:3001 so no base URL is needed.
const apiUrl = import.meta.env.VITE_API_URL;
if (apiUrl) {
  setBaseUrl(apiUrl);
}

createRoot(document.getElementById("root")!).render(<App />);
