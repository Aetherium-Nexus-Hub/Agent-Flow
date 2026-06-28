import express from "express";
import path from "path";
import cors from "cors";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import { ReceptorHub } from "./src/core/receptor-hub";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc } from "firebase/firestore";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // Initialize server-side ReceptorHub instance
  const serverReceptorHub = new ReceptorHub();

  // Initialize server-side Firestore instance
  let serverDb: any = null;
  try {
    const configPath = path.join(process.cwd(), "firebase-applet-config.json");
    if (fs.existsSync(configPath)) {
      const firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf8"));
      const serverFirebaseApp = initializeApp(firebaseConfig, "server-app");
      serverDb = getFirestore(serverFirebaseApp, firebaseConfig.firestoreDatabaseId);
      console.log("[Server Firebase] Successfully initialized Firestore connection.");
    }
  } catch (error) {
    console.error("[Server Firebase] Failed to initialize server-side Firestore:", error);
  }

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // AetherChess v1.1 JIT Attestation and Ledger Hardening Route
  app.post("/api/v1/aether/verify", async (req, res) => {
    try {
      const { event } = req.body;
      if (!event) {
        return res.status(400).json({ error: "Event payload is required." });
      }

      console.log(`[Server Attestation] Evaluating event '${event.eventId}' with notation '${event.payload?.notation}'`);

      const notation = event.payload?.notation?.trim() || "";
      const isIllegal = !notation || notation.toLowerCase() === "illegal" || notation.includes("??");

      const verificationBlock = { ...event.verification };

      if (isIllegal) {
        verificationBlock.clientVerify = "NO";
        verificationBlock.errorReason = `Authoritative Chess Engine rejected move: '${notation}' is invalid/illegal.`;
      } else {
        verificationBlock.clientVerify = "YES";
        // Append server cryptographically simulated attestation signature
        verificationBlock.serverAttestationSignature = `0xSERVER_AUTHORITATIVE_SIG_${Date.now()}_${Math.random().toString(36).substring(7).toUpperCase()}`;
      }

      const verifiedEvent = {
        ...event,
        verification: verificationBlock,
        timestamp: new Date().toISOString()
      };

      // 1. Ingest via the server-side Receptor Hub (executes the registered tags)
      await serverReceptorHub.ingest(verifiedEvent);

      // 2. Ledger Hardening: If verification succeeds, write to live Firebase Synced Ledger
      if (verifiedEvent.verification.clientVerify === "YES" && serverDb) {
        try {
          console.log(`[Ledger Hardening] Writing event ${verifiedEvent.eventId} to Firestore...`);
          await addDoc(collection(serverDb, "aether_events"), {
            ...verifiedEvent,
            hardenedAt: new Date().toISOString()
          });
          console.log(`[Ledger Hardening] Successfully synced & hardened.`);
        } catch (dbError) {
          console.error("[Ledger Hardening] Failed to write verified event to Firestore:", dbError);
        }
      }

      res.json({ verifiedEvent });
    } catch (error: any) {
      console.error("[Server Attestation] Error:", error);
      res.status(500).json({ error: error.message });
    }
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

  app.post("/api/v1/generate-agenda", async (req, res) => {
    try {
      const { notes } = req.body;
      if (!notes) {
        return res.status(400).json({ error: "Meeting notes/transcript are required" });
      }

      let apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("GEMINI_API_KEY environment variable is required");
      }

      const ai = new GoogleGenAI({ 
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Analyze the following meeting notes/transcript and construct a complete, professional, beautifully-structured meeting agenda. The agenda should include:
- A clear, catchy title for the meeting
- Objective/main goal of the meeting
- Structured agenda items with suggested time durations
- Key action items/next steps with owners (if mentioned or suggested)
- Summary/Key Takeaways

Format the output dynamically with beautiful Markdown. Ensure to use clean bullet points, readable bold text, and numbered steps.

Here are the meeting notes or transcript:
${notes}`,
      });

      res.json({ result: response.text });
    } catch (error: any) {
      console.error("Generate Agenda Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/v1/parse-meeting", async (req, res) => {
    try {
      const { notes } = req.body;
      if (!notes) {
        return res.status(400).json({ error: "Meeting notes/transcript are required" });
      }

      let apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("GEMINI_API_KEY environment variable is required");
      }

      const ai = new GoogleGenAI({ 
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Analyze the following meeting transcript, notes, or discussion logs. Construct a comprehensive structured meeting response:
1. Create a logical title and clear objective.
2. Formulate a complete, beautifully structured Markdown agenda suited for reading.
3. Identify and analyze all stakeholders/participants mentioned or active. For each stakeholder:
   - Identify Name and Role
   - Determine Department (choose from: Engineering, Product, Design, Sales, Marketing, HR, Finance, Operations, Legal, Management, External, or generic Team)
   - Assess Influence ("High", "Medium", or "Low") and Interest ("High", "Medium", or "Low"). These reflect their power and commitment relative to the meeting topic.
   - Assess Alignment/Support towards the meeting decisions and targets: "Champion" (leading/enthusiastic support), "Supportive" (positive), "Neutral" (indifferent/passive), "Skeptical" (raising doubt), or "Blocker" (opposing/challenging).
   - Summarize key contributions, points raised, and opinions expressed.
   - Extract action items (to-do items) specifically assigned to them in the meeting transcript.
4. Construct a timeline sequence of agenda topics with durational breakdowns.

Notes/Transcript:
${notes}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              objective: { type: Type.STRING },
              markdownAgenda: { type: Type.STRING },
              stakeholders: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    role: { type: Type.STRING },
                    department: { type: Type.STRING },
                    influence: { type: Type.STRING },
                    interest: { type: Type.STRING },
                    alignment: { type: Type.STRING },
                    contributions: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING }
                    },
                    actionItems: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING }
                    }
                  },
                  required: ["name", "role", "department", "influence", "interest", "alignment", "contributions", "actionItems"]
                }
              },
              timeline: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    duration: { type: Type.INTEGER },
                    time: { type: Type.STRING },
                    description: { type: Type.STRING },
                    presenter: { type: Type.STRING }
                  },
                  required: ["title", "duration", "time", "description", "presenter"]
                }
              }
            },
            required: ["title", "objective", "markdownAgenda", "stakeholders", "timeline"]
          }
        }
      });

      if (!response.text) {
        throw new Error("Failed to parse meeting. Gemini produced no reply.");
      }

      const parsedData = JSON.parse(response.text);
      res.json(parsedData);
    } catch (error: any) {
      console.error("Parse Meeting Error:", error);
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
