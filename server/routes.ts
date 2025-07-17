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
  if (req.isAuthenticated() && req.user && (req.user as any).isAdmin) {
    return next();
  }
  res.status(403).send("Forbidden");
}

export async function registerRoutes(app: Express): Promise<Server> {
  app.get("/api/users/:id/pastes", async (req: Request, res: Response) => {
    const userId = parseInt(req.params.id);
    if (isNaN(userId)) return res.status(400).send("Invalid user id");
    const pastes = await storage.getUserPastes(userId);
    res.json(pastes);
  });
  app.get("/p", async (_req: Request, res: Response) => {
    const pastes = await storage.getAllPastes();
    res.json(pastes.filter((paste: any) => !paste.isPrivate));
  });
  app.get("/pastes", async (_req: Request, res: Response) => {
    const pastes = await storage.getAllPastes();
    // Only return public pastes
    res.json(pastes.filter((paste: any) => !paste.isPrivate));
  });
  setupAuth(app);

  app.get("/api/users", ensureAuthenticated, async (_req: Request, res: Response) => {
    const users = await storage.getAllUsers();
    res.json(users);
  });

  app.delete("/api/users/:id", ensureAdmin, async (req: Request, res: Response) => {
    const userId = parseInt(req.params.id);
    const user = await storage.getUser(userId);

    // Protect special users
    if (user && ["victim", "convicted"].includes((user as any).username)) {
      return res.status(403).send("Cannot delete protected users");
    }

    await storage.deleteUser(userId);
    res.sendStatus(200);
  });

  app.patch("/api/users/:id", ensureAuthenticated, async (req: Request, res: Response) => {
    const userId = parseInt(req.params.id);
    const user = await storage.getUser(userId);

    // Protect special users
    if (user && ["victim", "convicted"].includes((user as any).username)) {
      return res.status(403).send("Cannot modify protected users");
    }

    // Only admins can change admin status or modify other users
    if ((req.body.isAdmin !== undefined || userId !== (req.user as any)?.id) && !(req.user as any)?.isAdmin) {
      return res.status(403).send("Forbidden");
    }

    await storage.updateUser(userId, req.body);
    const updatedUser = await storage.getUser(userId);
    res.json(updatedUser);
  });

  app.post("/api/pastes", ensureAuthenticated, async (req: Request, res: Response) => {
    const result = insertPasteSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json(result.error);
    }

    const paste = await storage.createPaste({
      ...result.data,
      userId: (req.user as any)?.id,
    });
    res.status(201).json(paste);
  });

  app.get("/api/pastes/pinned", async (_req: Request, res: Response) => {
    const pastes = await storage.getPinnedPastes();
    res.json(pastes);
  });

  app.get("/api/pastes/recent", async (_req: Request, res: Response) => {
    const pastes = await storage.getRecentPastes(10);
    res.json(pastes);
  });

  app.get("/api/pastes/:urlId", async (req: Request, res: Response) => {
    const paste = await storage.getPaste(req.params.urlId);
    if (!paste) {
      return res.status(404).send("Paste not found");
    }

    if (paste.isPrivate) {
      // If paste requires password
      if (paste.password) {
        const suppliedPassword = req.query.password as string | undefined;
        if (!suppliedPassword || suppliedPassword !== paste.password) {
          return res.status(403).send("Password required");
        }
      } 
      // If paste is private but doesn't have password, check user ownership
      else if (!req.isAuthenticated() || (req.user as any)?.id !== paste.userId) {
        return res.status(403).send("Forbidden");
      }
    }

    res.json(paste);
  });

  app.post("/api/pastes/:id/pin", ensureAdmin, async (req: Request, res: Response) => {
    await storage.setPastePinned(parseInt(req.params.id), req.body.isPinned);
    res.sendStatus(200);
  });

  app.delete("/api/pastes/:id", ensureAdmin, async (req: Request, res: Response) => {
    await storage.deletePaste(parseInt(req.params.id));
    res.sendStatus(200);
  });

  const httpServer = createServer(app);
  return httpServer;
}