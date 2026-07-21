import { beforeEach, describe, expect, it, vi } from "vitest";
import { ethers } from "ethers";

vi.mock("next-auth/next", () => ({
  getServerSession: vi.fn(),
}));

import { getServerSession } from "next-auth/next";
import handler from "@/pages/api/auth/getWalletSeedFromSession";

function createMockRes() {
  const res: any = {};
  res.status = (code: number) => {
    res.statusCode = code;
    return res;
  };
  res.json = (data: any) => {
    res.body = data;
    return res;
  };
  return res;
}

// Golden vectors: fixed expected outputs for the NEXT_AUTH_SEED set in
// vitest.setup.ts ("test-fixed-seed-for-ci"). Hardcoded rather than
// re-derived so a change to the derivation algorithm fails the test
// instead of silently tracking it. Regenerate only on a deliberate change.
const GOOGLE_USER = { provider: "google", email: "alice@example.com", name: "Alice" };
const GOOGLE_SEED = "0xcdcfbdd821feb1527aa0471f0b4d2249a8e5e9e067434e48e3cde9038ed6dba2";
const GITHUB_USER = { provider: "github", email: "bob@example.com" };
const GITHUB_SEED = "0xe5ad2d53729ba41c60974d41680a61db0803abd24aabb1e9035a79800e3afa2e";
// Address of the service wallet derived from NEXT_AUTH_SEED (see getAddress).
const SERVICE_ADDRESS = "0x69fF97680A5a75b4b5c9156778098641f46b008C";

describe("getWalletSeedFromSession", () => {
  beforeEach(() => {
    vi.mocked(getServerSession).mockReset();
  });

  it("returns 400 when there is no session", async () => {
    vi.mocked(getServerSession).mockResolvedValue(null);
    const res = createMockRes();

    await handler({} as any, res);

    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({ error: "No session found" });
  });

  it("returns 400 when the session is an empty object", async () => {
    vi.mocked(getServerSession).mockResolvedValue({} as any);
    const res = createMockRes();

    await handler({} as any, res);

    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({ error: "No session found" });
  });

  it("returns 400 when the session has no user", async () => {
    vi.mocked(getServerSession).mockResolvedValue({ expires: "2099-01-01" } as any);
    const res = createMockRes();

    await handler({} as any, res);

    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({ error: "No user found in session" });
  });

  it("returns 400 for a google session with no email", async () => {
    const user = { provider: "google" };
    vi.mocked(getServerSession).mockResolvedValue({ user } as any);
    const res = createMockRes();

    await handler({} as any, res);

    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({ error: "No email found" });
  });

  it("signs the email for a google session and returns the derived seed", async () => {
    const user = GOOGLE_USER;
    vi.mocked(getServerSession).mockResolvedValue({ user } as any);
    const res = createMockRes();

    await handler({} as any, res);

    expect(res.statusCode).toBe(200);
    expect(res.body.seed).toBe(GOOGLE_SEED);
    expect(res.body.email).toBe(user.email);
    expect(res.body.userName).toBe("Alice");

    // The recovered signer must be the service wallet (fixed golden address).
    expect(ethers.verifyMessage(user.email, res.body.signedEmail)).toBe(SERVICE_ADDRESS);
  });

  it("does not sign the email for a non-google session", async () => {
    const user = GITHUB_USER;
    vi.mocked(getServerSession).mockResolvedValue({ user } as any);
    const res = createMockRes();

    await handler({} as any, res);

    expect(res.statusCode).toBe(200);
    expect(res.body.seed).toBe(GITHUB_SEED);
    expect(res.body.signedEmail).toBeUndefined();
    expect(res.body.userName).toBe(" ");
  });

  it("derives the same seed for the same session user", async () => {
    const user = { provider: "github", email: "carol@example.com", name: "Carol" };
    vi.mocked(getServerSession).mockResolvedValue({ user } as any);

    const res1 = createMockRes();
    const res2 = createMockRes();
    await handler({} as any, res1);
    await handler({} as any, res2);

    expect(res1.body.seed).toBe(res2.body.seed);
  });
});
