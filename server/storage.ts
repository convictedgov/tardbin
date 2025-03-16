import { User, InsertUser, Paste, InsertPaste } from "@shared/schema";
import { randomBytes, scrypt } from "crypto";
import { promisify } from "util";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);
const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;

  createPaste(paste: InsertPaste & { userId: number }): Promise<Paste>;
  getPaste(urlId: string): Promise<Paste | undefined>;
  getPinnedPastes(): Promise<Paste[]>;
  getRecentPastes(limit: number): Promise<Paste[]>;
  setPastePinned(id: number, isPinned: boolean): Promise<void>;

  sessionStore: session.Store;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private pastes: Map<number, Paste>;
  private currentUserId: number;
  private currentPasteId: number;
  sessionStore: session.Store;

  constructor() {
    this.users = new Map();
    this.pastes = new Map();
    this.currentUserId = 1;
    this.currentPasteId = 1;
    this.sessionStore = new MemoryStore({ checkPeriod: 86400000 });

    // Create default admin users with properly hashed passwords
    this.initializeAdminUsers();
  }

  private async initializeAdminUsers() {
    // Create convicted admin
    const convictedUser = await this.createUser({
      username: "convicted",
      password: await hashPassword("wbetr87witb46btbz87tb7i6t4wbab4687ab$^Rv7IBwt*"),
    });
    this.users.set(convictedUser.id, { ...convictedUser, isAdmin: true });

    // Create victim admin
    const victimUser = await this.createUser({
      username: "victim",
      password: await hashPassword("*BTirebeg6wG&^Bge^&G9nie^Gb"),
    });
    this.users.set(victimUser.id, { ...victimUser, isAdmin: true });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { 
      ...insertUser, 
      id, 
      isAdmin: false,
      avatarUrl: null
    };
    this.users.set(id, user);
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async createPaste(paste: InsertPaste & { userId: number }): Promise<Paste> {
    const id = this.currentPasteId++;
    const urlId = randomBytes(6).toString('hex');
    const newPaste: Paste = {
      id,
      urlId,
      userId: paste.userId,
      title: paste.title,
      content: paste.content,
      isPrivate: paste.isPrivate || false,
      password: paste.password || null,
      isPinned: false,
      createdAt: new Date(),
    };
    this.pastes.set(id, newPaste);
    return newPaste;
  }

  async getPaste(urlId: string): Promise<Paste | undefined> {
    return Array.from(this.pastes.values()).find(
      (paste) => paste.urlId === urlId,
    );
  }

  async getPinnedPastes(): Promise<Paste[]> {
    return Array.from(this.pastes.values())
      .filter(paste => paste.isPinned)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getRecentPastes(limit: number): Promise<Paste[]> {
    return Array.from(this.pastes.values())
      .filter(paste => !paste.isPrivate)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  async setPastePinned(id: number, isPinned: boolean): Promise<void> {
    const paste = this.pastes.get(id);
    if (paste) {
      this.pastes.set(id, { ...paste, isPinned });
    }
  }
}

export const storage = new MemStorage();