import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "./fix-styles.css"; // Import fix-styles.css for shadcn-ui class fixes
import { AuthProvider } from "./contexts/AuthContext";

console.log("Sales Dashboard starting up...");

createRoot(document.getElementById("root")!).render(
  <AuthProvider>
    <App />
  </AuthProvider>
);
