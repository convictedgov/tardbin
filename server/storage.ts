import { User, InsertUser, Paste, InsertPaste } from "@shared/schema";
import { randomBytes, scrypt } from "crypto";
import { promisify } from "util";
import session from "express-session";
import createMemoryStore from "memorystore";
import fs from "fs/promises";
import path from "path";

const MemoryStore = createMemoryStore(session);
const scryptAsync = promisify(scrypt);

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
      .then(() => {
        console.log("[Storage] Created storage directories");
        return this.loadData();
      })
      .then(() => {
        // Initialize admin users if no users exist
        if (this.users.size === 0) {
          console.log("[Storage] No users found, initializing admin users");
          this.initializeAdminUsers();
        } else {
          console.log(`[Storage] Loaded ${this.users.size} users and ${this.pastes.size} pastes`);
        }
      })
      .catch(err => {
        console.error("[Storage] Error initializing storage:", err);
      });
  }

  private async loadData() {
    try {
      const usersData = await fs.readFile(USERS_FILE, 'utf-8');
      const users = JSON.parse(usersData);
      this.users = new Map(users.map((user: User) => [user.id, user]));
      this.currentUserId = Math.max(...Array.from(this.users.keys()), 0) + 1;
      console.log(`[Storage] Loaded ${this.users.size} users from ${USERS_FILE}`);
    } catch (err) {
      console.log("[Storage] No existing users file found, starting fresh");
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
      console.log(`[Storage] Loaded ${this.pastes.size} pastes from ${PASTES_DIR}`);
    } catch (err) {
      console.log("[Storage] No existing pastes found, starting fresh");
    }
  }

  private async saveUser(user: User) {
    this.users.set(user.id, user);
    await fs.writeFile(USERS_FILE, JSON.stringify(Array.from(this.users.values()), null, 2));
    console.log(`[Storage] Saved user ${user.username} (ID: ${user.id})`);
  }

  private async savePaste(paste: Paste) {
    this.pastes.set(paste.id, paste);
    const filePath = path.join(PASTES_DIR, `${paste.urlId}.json`);
    await fs.writeFile(filePath, JSON.stringify(paste, null, 2));
    console.log(`[Storage] Saved paste ${paste.title} (ID: ${paste.id}, URL: ${paste.urlId})`);
  }

  private async initializeAdminUsers() {
    // Create convicted admin
    const convictedUser = await this.createUser({
      username: "convicted",
      password: "wbetr87witb46btbz87tb7i6t4wbab4687ab$^Rv7IBwt*",
    });
    await this.updateUser(convictedUser.id, { isAdmin: true });

    // Create victim admin
    const victimUser = await this.createUser({
      username: "victim",
      password: "*BTirebeg6wG&^Bge^&G9nie^Gb",
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
      avatarUrl: null,
      password: await hashPassword(insertUser.password)
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
    console.log(`[Storage] Deleted user ${id}`);
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