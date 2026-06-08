import express from "express";
import path from "path";
import cors from "cors";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.post("/api/v1/query", async (req, res) => {
    try {
      const { query } = req.body;
      let apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("GEMINI_API_KEY environment variable is required");
      }

      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: query || "Hello from the Bedrock Engine!",
      });

      res.json({ result: response.text });
    } catch (error: any) {
      console.error("Query Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // GitHub Resonance Scan Proxy Route
  app.post("/api/resonance/scan", async (req, res) => {
    try {
      const { repo, branch } = req.body;
      if (!repo || !branch) {
        return res.status(400).json({ error: "Repository and branch are required" });
      }

      console.log(`Forwarding resonance scan request for ${repo} [${branch}] to Aetherium Nexus...`);
      const response = await fetch("https://aetheriumnexus.store/api/source/v0.1/resonance.scan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ repo, branch })
      });

      const statusCode = response.status;
      const text = await response.text();
      let parseResult: any;
      try {
        parseResult = JSON.parse(text);
      } catch (e) {
        parseResult = { rawText: text };
      }

      console.log(`Aetherium Nexus node returned status ${statusCode}`);
      res.status(statusCode).json({
        ok: response.ok,
        status: statusCode,
        data: parseResult
      });
    } catch (error: any) {
      console.error("Resonance Scan Proxy Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
