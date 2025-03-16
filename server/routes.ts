import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertPasteSchema } from "@shared/schema";

function ensureAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).send("Unauthorized");
}

function ensureAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated() && req.user.isAdmin) {
    return next();
  }
  res.status(403).send("Forbidden");
}

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  app.get("/api/users", ensureAuthenticated, async (_req, res) => {
    const users = await storage.getAllUsers();
    res.json(users);
  });

  app.post("/api/pastes", ensureAuthenticated, async (req, res) => {
    const result = insertPasteSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json(result.error);
    }

    const paste = await storage.createPaste({
      ...result.data,
      userId: req.user!.id,
    });
    res.status(201).json(paste);
  });

  app.get("/api/pastes/pinned", async (_req, res) => {
    const pastes = await storage.getPinnedPastes();
    res.json(pastes);
  });

  app.get("/api/pastes/recent", async (_req, res) => {
    const pastes = await storage.getRecentPastes(10);
    res.json(pastes);
  });

  app.get("/api/pastes/:urlId", async (req, res) => {
    const paste = await storage.getPaste(req.params.urlId);
    if (!paste) {
      return res.status(404).send("Paste not found");
    }

    if (paste.isPrivate) {
      if (!paste.password) {
        if (!req.isAuthenticated() || req.user!.id !== paste.userId) {
          return res.status(403).send("Forbidden");
        }
      } else {
        const password = req.query.password;
        if (password !== paste.password) {
          return res.status(403).send("Invalid password");
        }
      }
    }

    res.json(paste);
  });

  app.post("/api/pastes/:id/pin", ensureAdmin, async (req, res) => {
    await storage.setPastePinned(parseInt(req.params.id), req.body.isPinned);
    res.sendStatus(200);
  });

  const httpServer = createServer(app);
  return httpServer;
}