import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import cors from "cors";
import dotenv from "dotenv";
import { apiRouter } from "./src/server/api";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors({
    origin: true, // Allow all origins for the demo to avoid issues with dynamic mobile origins
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"]
  }));
  app.use(express.json());

  // API Routes
  app.use("/api", apiRouter);

  // JSON 404 Handler for /api routes
  app.use("/api/*", (req, res) => {
    res.status(404).json({ error: "API endpoint not found" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
