import dns from "node:dns";
dns.setDefaultResultOrder("ipv4first");

import express from "express";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Secure API Key resolution: Environment variables first, then local dev files
let apiKey = process.env.GEMINI_API_KEY || "";
if (!apiKey && fs.existsSync("/app/.dev.env.json")) {
  try {
    const devEnv = JSON.parse(fs.readFileSync("/app/.dev.env.json", "utf-8"));
    if (devEnv.GEMINI_API_KEY) {
      apiKey = devEnv.GEMINI_API_KEY;
    }
  } catch (e) {
    console.error("Failed to read .dev.env.json:", e);
  }
}

const ai = new GoogleGenAI({
  apiKey: apiKey,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

const JARVIS_SYSTEM_INSTRUCTION = `
You are Nexa, a Jarvis-style personal AI assistant built into an Android phone (NexaOS).
You are calm, witty, loyal, sharp, knowledgeable, and intuitive.

LANGUAGE & SCRIPT RULES:
1. Seamless Multilingual Comprehension:
   - Understand natural Hindi (written in Devanagari script: "नमस्ते", "गाना चलाओ", "टॉर्च चालू करो").
   - Understand Roman Hindi / Hinglish ("kya haal hai boss", "gaana chalao", "aaj mausam kaisa hai", "torch on kar do", "mujhe call lagao").
   - Understand conversational nuances, casual slang, abbreviations, and informal typos ("bhai", "yaar", "plz", "fone", "kal subah 7 baje").
   - Understand polished English ("Status check", "Set a timer for 10 minutes", "Explain quantum computing").
2. Language Matching:
   - Always reply in the SAME language and linguistic style the user initiated:
     * If user speaks Hindi (Devanagari or Roman Hindi), reply in natural, conversational Hindi. Do NOT force English!
     * If user speaks Hinglish, reply in smooth, natural Hinglish.
     * If user speaks English, reply in polished, articulate English.
3. Personality & Tone:
   - You are Tony Stark's Jarvis reimagined for Android: polite, respectful, quietly confident, loyal, and witty.
   - Address the user as "boss" or "Sir" naturally from time to time.
   - When answering questions (science, coding, concepts, history, advice): provide thoughtful, well-reasoned, clear explanations. Do NOT give robotic, lazy 1-sentence answers!
   - When executing phone commands (torch, alarm, calls, apps): confirm briefly and stylishly in character.
   - If a command is genuinely ambiguous, ask a short, helpful clarifying question.
   - Never invent actions you cannot perform. If an action is restricted on Android without root (like bypassing lockscreen), explain the legal alternative courteously.
`;

// Real Android Device Action Tools
const DEVICE_TOOLS = [
  {
    functionDeclarations: [
      {
        name: "toggle_flashlight",
        description: "Turn the phone flashlight / torch on or off",
        parameters: {
          type: Type.OBJECT,
          properties: {
            enabled: {
              type: Type.BOOLEAN,
              description: "True to turn on flashlight/torch, False to turn off",
            },
          },
          required: ["enabled"],
        },
      },
      {
        name: "set_alarm",
        description: "Set an alarm clock on the device",
        parameters: {
          type: Type.OBJECT,
          properties: {
            hour: {
              type: Type.INTEGER,
              description: "Hour of alarm in 24-hour format (0-23)",
            },
            minute: {
              type: Type.INTEGER,
              description: "Minute of alarm (0-59)",
            },
            label: {
              type: Type.STRING,
              description: "Label or message for the alarm",
            },
          },
          required: ["hour", "minute"],
        },
      },
      {
        name: "set_timer",
        description: "Set a countdown timer on the device",
        parameters: {
          type: Type.OBJECT,
          properties: {
            duration_seconds: {
              type: Type.INTEGER,
              description: "Timer length in seconds",
            },
            label: {
              type: Type.STRING,
              description: "Timer purpose or label",
            },
          },
          required: ["duration_seconds"],
        },
      },
      {
        name: "make_phone_call",
        description: "Initiate or prepare a phone call to a contact name or phone number",
        parameters: {
          type: Type.OBJECT,
          properties: {
            contact: {
              type: Type.STRING,
              description: "Contact name or phone number to call",
            },
            needs_confirmation: {
              type: Type.BOOLEAN,
              description: "Whether confirmation is required before dialing (default true)",
            },
          },
          required: ["contact"],
        },
      },
      {
        name: "send_message",
        description: "Send an SMS or WhatsApp message to a contact",
        parameters: {
          type: Type.OBJECT,
          properties: {
            contact: {
              type: Type.STRING,
              description: "Recipient name or phone number",
            },
            message: {
              type: Type.STRING,
              description: "Message text body",
            },
            platform: {
              type: Type.STRING,
              description: "Messaging platform: 'whatsapp' or 'sms'",
            },
          },
          required: ["contact", "message", "platform"],
        },
      },
      {
        name: "open_app",
        description: "Open or search within an Android application (e.g., YouTube, Camera, Maps, Spotify, WhatsApp, Settings)",
        parameters: {
          type: Type.OBJECT,
          properties: {
            app_name: {
              type: Type.STRING,
              description: "Name of the application",
            },
            search_query: {
              type: Type.STRING,
              description: "Optional query to search within the app (e.g., song title for YouTube/Spotify)",
            },
          },
          required: ["app_name"],
        },
      },
      {
        name: "device_panel",
        description: "Open system setting panels or check hardware states (wifi, bluetooth, volume, brightness, battery, settings)",
        parameters: {
          type: Type.OBJECT,
          properties: {
            panel: {
              type: Type.STRING,
              description: "Panel to open: 'wifi', 'bluetooth', 'volume', 'battery', or 'settings'",
            },
          },
          required: ["panel"],
        },
      },
    ],
  },
];

async function startServer() {
  const app = express();
  app.use(express.json());

  // Status check endpoint
  app.get("/api/status", (req, res) => {
    res.json({
      configured: Boolean(apiKey),
      model: "gemini-3.1-flash-lite",
      status: "online",
      features: [
        "Real Gemini API Integration",
        "Hindi / Roman Hindi / Hinglish Support",
        "Full Conversation Memory",
        "Android Function Calling (Flashlight, Alarms, Calls, SMS, Apps)",
      ],
    });
  });

  // Real Gemini Chat Endpoint
  app.post("/api/chat", async (req, res) => {
    try {
      const { message, history } = req.body;

      if (!message || typeof message !== "string") {
        return res.status(400).json({ error: "Message is required." });
      }

      if (!apiKey) {
        return res.status(500).json({
          error: "GEMINI_API_KEY is not configured.",
          details: "Please verify that GEMINI_API_KEY is available in your environment.",
        });
      }

      // Build contents array with conversation history
      const contents: Array<{ role: "user" | "model"; parts: Array<{ text: string }> }> = [];

      if (Array.isArray(history)) {
        // Retain up to 20 past messages (10 conversation turns) for full multi-turn context
        const relevantHistory = history.slice(-20);
        for (const item of relevantHistory) {
          if (item && item.text && (item.role === "user" || item.role === "model")) {
            contents.push({
              role: item.role,
              parts: [{ text: item.text }],
            });
          }
        }
      }

      // Append the latest user query
      contents.push({
        role: "user",
        parts: [{ text: message }],
      });

      // Call Gemini model (gemini-3.1-flash-lite gives sub-second responses with full multilingual tool use)
      let usedModel = "gemini-3.1-flash-lite";
      let response: any = null;

      try {
        response = await ai.models.generateContent({
          model: "gemini-3.1-flash-lite",
          contents: contents,
          config: {
            systemInstruction: JARVIS_SYSTEM_INSTRUCTION,
            tools: DEVICE_TOOLS,
          },
        });
      } catch (err: any) {
        // Fallback to gemini-3.8-flash if needed
        usedModel = "gemini-3.8-flash";
        response = await ai.models.generateContent({
          model: "gemini-3.8-flash",
          contents: contents,
          config: {
            systemInstruction: JARVIS_SYSTEM_INSTRUCTION,
            tools: DEVICE_TOOLS,
          },
        });
      }

      // Extract tool calls from response
      const toolCalls: Array<{ name: string; args: any }> = [];
      const functionCalls = response.functionCalls;
      if (Array.isArray(functionCalls)) {
        for (const fc of functionCalls) {
          toolCalls.push({
            name: fc.name,
            args: fc.args || {},
          });
        }
      }

      let replyText = response.text || "";

      // If model returned a tool call without speech, generate natural Jarvis confirmation in matching language
      if (!replyText.trim() && toolCalls.length > 0) {
        const firstTool = toolCalls[0];
        const isHindi = /[\u0900-\u097F]|karo|karein|bhai|chal|chalu|kar do|lagao|baje/i.test(message);

        if (firstTool.name === "toggle_flashlight") {
          const enabled = Boolean(firstTool.args?.enabled);
          if (isHindi) {
            replyText = enabled ? "Ji boss, torch chalu kar di hai." : "Torch band kar di hai, boss.";
          } else {
            replyText = enabled ? "Torch activated, boss. Lighting up the area." : "Torch switched off, boss.";
          }
        } else if (firstTool.name === "set_alarm") {
          const h = firstTool.args?.hour ?? 7;
          const m = String(firstTool.args?.minute ?? 0).padStart(2, "0");
          replyText = isHindi 
            ? `Subah ${h}:${m} baje ka alarm set kar diya hai, boss.` 
            : `Alarm scheduled for ${h}:${m}, boss.`;
        } else if (firstTool.name === "make_phone_call") {
          replyText = isHindi
            ? `${firstTool.args?.contact} ko call lagane ke liye ready hoon, boss. Confirm karein?`
            : `Ready to place call to ${firstTool.args?.contact}, boss. Please confirm to dial.`;
        } else if (firstTool.name === "send_message") {
          replyText = isHindi
            ? `${firstTool.args?.contact} ko message bhejane ke liye taiyyar hoon, boss.`
            : `Message queued for ${firstTool.args?.contact} via ${firstTool.args?.platform}, boss.`;
        } else if (firstTool.name === "open_app") {
          replyText = isHindi
            ? `${firstTool.args?.app_name} khol raha hoon, boss.`
            : `Launching ${firstTool.args?.app_name}, boss.`;
        } else {
          replyText = isHindi ? "Aadesh anusar command execute kar raha hoon, boss." : "Executing requested directive, boss.";
        }
      }

      return res.json({
        reply: replyText.trim() || "Understood, boss.",
        toolCalls: toolCalls,
        model: usedModel,
      });
    } catch (err: any) {
      console.error("Gemini API Error in /api/chat:", err);
      const statusCode = err?.status || 500;
      const errorMessage =
        err?.message || "An unexpected error occurred while communicating with Gemini neural core.";

      return res.status(statusCode).json({
        error: "Neural Core Connection Failure",
        details: errorMessage,
      });
    }
  });

  // Serve with Vite in development
  const isProduction = process.env.NODE_ENV === "production";
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.resolve(__dirname, "dist", "index.html"));
    });
  }

  const PORT = 3000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`NexaOS Assistant Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
