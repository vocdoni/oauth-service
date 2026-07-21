import { beforeEach, describe, expect, it, vi } from "vitest";
import { ethers, id } from "ethers";

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

function expectedSeedFor(user: object) {
  return ethers.hashMessage(JSON.stringify(user) + process.env.NEXT_AUTH_SEED);
}

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
    const user = { provider: "google", email: "alice@example.com", name: "Alice" };
    vi.mocked(getServerSession).mockResolvedValue({ user } as any);
    const res = createMockRes();

    await handler({} as any, res);

    expect(res.statusCode).toBe(200);
    expect(res.body.seed).toBe(expectedSeedFor(user));
    expect(res.body.email).toBe(user.email);
    expect(res.body.userName).toBe("Alice");

    const signingWallet = new ethers.Wallet(id(process.env.NEXT_AUTH_SEED as string));
    expect(ethers.verifyMessage(user.email, res.body.signedEmail)).toBe(signingWallet.address);
  });

  it("does not sign the email for a non-google session", async () => {
    const user = { provider: "github", email: "bob@example.com" };
    vi.mocked(getServerSession).mockResolvedValue({ user } as any);
    const res = createMockRes();

    await handler({} as any, res);

    expect(res.statusCode).toBe(200);
    expect(res.body.seed).toBe(expectedSeedFor(user));
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
