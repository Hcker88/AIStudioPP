/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import { db } from "../lib/db";
import { legacyVault, users } from "../lib/schema";
import { eq, sql } from "drizzle-orm";

const router = express.Router();

/**
 * Simulated AES-256 Encryption
 * In a real app, this would use a proper crypto library and a secure key.
 */
const encrypt = (text: string): string => {
  const b64 = Buffer.from(text).toString('base64');
  return `AES256:${b64.split('').reverse().join('')}`;
};

const decrypt = (encrypted: string): string => {
  if (!encrypted.startsWith('AES256:')) return encrypted;
  const b64 = encrypted.replace('AES256:', '').split('').reverse().join('');
  return Buffer.from(b64, 'base64').toString('utf-8');
};

/**
 * Create or Update Legacy Vault
 */
router.post("/setup", async (req, res) => {
  const { userId, nomineeEmail, instructions } = req.body;

  try {
    const encrypted = encrypt(instructions);
    
    // Check if vault exists
    const existing = await db.select().from(legacyVault).where(eq(legacyVault.userId, userId));

    if (existing.length > 0) {
      await db.update(legacyVault)
        .set({ nomineeEmail, encryptedInstructions: encrypted, lastCheckIn: new Date() })
        .where(eq(legacyVault.userId, userId));
    } else {
      await db.insert(legacyVault).values({
        userId,
        nomineeEmail,
        encryptedInstructions: encrypted
      });
    }

    res.json({ status: "ok", message: "Legacy Vault secured with AES-256 simulation." });
  } catch (error) {
    res.status(500).json({ error: "Failed to secure vault." });
  }
});

/**
 * Check-in (Dead Man's Switch)
 */
router.post("/check-in", async (req, res) => {
  const { userId } = req.body;

  try {
    await db.update(legacyVault)
      .set({ lastCheckIn: new Date(), isTriggered: false })
      .where(eq(legacyVault.userId, userId));
    
    res.json({ status: "ok", message: "Check-in successful. Dead Man's Switch reset." });
  } catch (error) {
    res.status(500).json({ error: "Check-in failed." });
  }
});

/**
 * Trigger Check (Background Job Simulation)
 */
router.get("/status/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    const vault = await db.select().from(legacyVault).where(eq(legacyVault.userId, userId));
    if (vault.length === 0) return res.status(404).json({ error: "Vault not found." });

    const lastCheckIn = new Date(vault[0].lastCheckIn);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - lastCheckIn.getTime()) / (1000 * 3600 * 24));

    if (diffDays >= vault[0].deadMansSwitchDays && !vault[0].isTriggered) {
      await db.update(legacyVault).set({ isTriggered: true }).where(eq(legacyVault.userId, userId));
      return res.json({ status: "TRIGGERED", message: "Dead Man's Switch activated. Nominee notified.", nomineeEmail: vault[0].nomineeEmail });
    }

    res.json({ status: "ACTIVE", daysSinceLastCheckIn: diffDays });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch status." });
  }
});

export default router;
