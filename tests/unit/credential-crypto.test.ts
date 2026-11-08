import { afterEach, describe, expect, it } from "vitest";

import { decryptCredential, encryptCredential } from "@/lib/credential-crypto";

const originalKey = process.env.CREDENTIAL_ENCRYPTION_KEY;

afterEach(() => {
  if (originalKey === undefined) delete process.env.CREDENTIAL_ENCRYPTION_KEY;
  else process.env.CREDENTIAL_ENCRYPTION_KEY = originalKey;
});

describe("credential encryption", () => {
  it("round-trips a credential with authenticated encryption", () => {
    process.env.CREDENTIAL_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString("base64");
    const encrypted = encryptCredential("refresh-token");

    expect(encrypted).not.toContain("refresh-token");
    expect(decryptCredential(encrypted)).toBe("refresh-token");
  });

  it("rejects missing, malformed, and incorrectly sized keys", () => {
    delete process.env.CREDENTIAL_ENCRYPTION_KEY;
    expect(() => encryptCredential("token")).toThrow("not configured");

    process.env.CREDENTIAL_ENCRYPTION_KEY = Buffer.alloc(16).toString("base64");
    expect(() => encryptCredential("token")).toThrow("decode to 32 bytes");

    process.env.CREDENTIAL_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString("base64");
    expect(() => decryptCredential("not-encrypted")).toThrow("malformed");
  });

  it("detects ciphertext tampering", () => {
    process.env.CREDENTIAL_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString("base64");
    const encrypted = encryptCredential("refresh-token");
    const parts = encrypted.split(".");
    parts[2] = `${parts[2]}x`;

    expect(() => decryptCredential(parts.join("."))).toThrow();
  });
});
