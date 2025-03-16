import { User, InsertUser, Paste, InsertPaste } from "@shared/schema";
import { randomBytes, scrypt } from "crypto";
import { promisify } from "util";
import session from "express-session";
import createMemoryStore from "memorystore";
import fs from "fs/promises";
import path from "path";

const MemoryStore = createMemoryStore(session);
const scryptAsync = promisify(scrypt);

const STORAGE_KEYS = {
  USERS: 'paste_users',
  PASTES: 'paste_pastes',
  USER_ID: 'paste_current_user_id',
  PASTE_ID: 'paste_current_paste_id'
};

const STORAGE_DIR = "./.data";
const USERS_FILE = path.join(STORAGE_DIR, "users.json");
const PASTES_DIR = path.join(STORAGE_DIR, "pastes");

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
  updateUser(id: number, data: Partial<User>): Promise<void>;
  deleteUser(id: number): Promise<void>;
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

    // Create storage directory if it doesn't exist
    fs.mkdir(STORAGE_DIR, { recursive: true })
      .then(() => fs.mkdir(PASTES_DIR, { recursive: true }))
      .then(() => this.loadData())
      .then(() => {
        // Initialize admin users if no users exist
        if (this.users.size === 0) {
          this.initializeAdminUsers();
        }
      })
      .catch(console.error);
  }

  private async loadData() {
    try {
      const usersData = await fs.readFile(USERS_FILE, 'utf-8');
      const users = JSON.parse(usersData);
      this.users = new Map(users.map((user: User) => [user.id, user]));
      this.currentUserId = Math.max(...Array.from(this.users.keys())) + 1;
    } catch (err) {
      // File doesn't exist yet, that's fine
    }

    try {
      const pasteFiles = await fs.readdir(PASTES_DIR);
      for (const file of pasteFiles) {
        if (file.endsWith('.json')) {
          const pasteData = await fs.readFile(path.join(PASTES_DIR, file), 'utf-8');
          const paste = JSON.parse(pasteData);
          this.pastes.set(paste.id, paste);
          this.currentPasteId = Math.max(this.currentPasteId, paste.id + 1);
        }
      }
    } catch (err) {
      // Directory might be empty, that's fine
    }
  }

  private async saveUser(user: User) {
    this.users.set(user.id, user);
    await fs.writeFile(USERS_FILE, JSON.stringify(Array.from(this.users.values()), null, 2));
  }

  private async savePaste(paste: Paste) {
    this.pastes.set(paste.id, paste);
    await fs.writeFile(
      path.join(PASTES_DIR, `${paste.urlId}.json`),
      JSON.stringify(paste, null, 2)
    );
  }

  private async initializeAdminUsers() {
    // Create convicted admin
    const convictedUser = await this.createUser({
      username: "convicted",
      password: await hashPassword("wbetr87witb46btbz87tb7i6t4wbab4687ab$^Rv7IBwt*"),
    });
    await this.updateUser(convictedUser.id, { isAdmin: true });

    // Create victim admin
    const victimUser = await this.createUser({
      username: "victim",
      password: await hashPassword("*BTirebeg6wG&^Bge^&G9nie^Gb"),
    });
    await this.updateUser(victimUser.id, { isAdmin: true });
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
    await this.saveUser(user);
    return user;
  }

  async updateUser(id: number, data: Partial<User>): Promise<void> {
    const user = await this.getUser(id);
    if (user) {
      if (data.password) {
        data.password = await hashPassword(data.password);
      }
      await this.saveUser({ ...user, ...data });
    }
  }

  async deleteUser(id: number): Promise<void> {
    this.users.delete(id);
    await fs.writeFile(USERS_FILE, JSON.stringify(Array.from(this.users.values()), null, 2));
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
    await this.savePaste(newPaste);
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
      paste.isPinned = isPinned;
      await this.savePaste(paste);
    }
  }
}

export const storage = new MemStorage();