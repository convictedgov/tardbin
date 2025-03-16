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

const STORAGE_KEYS = {
  USERS: 'paste_users',
  PASTES: 'paste_pastes',
  USER_ID: 'paste_current_user_id',
  PASTE_ID: 'paste_current_paste_id'
};

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
    // Load data from localStorage if available
    const savedUsers = globalThis.localStorage?.getItem(STORAGE_KEYS.USERS);
    const savedPastes = globalThis.localStorage?.getItem(STORAGE_KEYS.PASTES);
    const savedUserId = globalThis.localStorage?.getItem(STORAGE_KEYS.USER_ID);
    const savedPasteId = globalThis.localStorage?.getItem(STORAGE_KEYS.PASTE_ID);

    this.users = new Map(savedUsers ? JSON.parse(savedUsers) : []);
    this.pastes = new Map(savedPastes ? JSON.parse(savedPastes) : []);
    this.currentUserId = savedUserId ? parseInt(savedUserId) : 1;
    this.currentPasteId = savedPasteId ? parseInt(savedPasteId) : 1;
    this.sessionStore = new MemoryStore({ checkPeriod: 86400000 });

    // Initialize admin users if no users exist
    if (this.users.size === 0) {
      this.initializeAdminUsers();
    }
  }

  private saveToLocalStorage() {
    if (!globalThis.localStorage) return;

    globalThis.localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(Array.from(this.users.entries())));
    globalThis.localStorage.setItem(STORAGE_KEYS.PASTES, JSON.stringify(Array.from(this.pastes.entries())));
    globalThis.localStorage.setItem(STORAGE_KEYS.USER_ID, this.currentUserId.toString());
    globalThis.localStorage.setItem(STORAGE_KEYS.PASTE_ID, this.currentPasteId.toString());
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

    this.saveToLocalStorage();
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
    this.saveToLocalStorage();
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
    this.saveToLocalStorage();
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
      this.saveToLocalStorage();
    }
  }
}

export const storage = new MemStorage();