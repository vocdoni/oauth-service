import { describe, expect, it } from "vitest";
import { authOptions } from "@/pages/api/auth/[...nextauth]";

describe("authOptions callbacks", () => {
  it("jwt callback copies account.provider onto the token", () => {
    const token: any = {};
    const result = authOptions.callbacks.jwt({
      token,
      account: { provider: "github" } as any,
    });

    expect(result.provider).toBe("github");
  });

  it("jwt callback leaves the token unchanged when there is no account", () => {
    const token: any = { provider: "existing" };
    const result = authOptions.callbacks.jwt({ token, account: null });

    expect(result.provider).toBe("existing");
  });

  it("session callback copies token.provider onto session.user.provider", async () => {
    const session: any = { user: { name: "Alice" } };
    const token: any = { provider: "google" };

    const result = await authOptions.callbacks.session({ session, token });

    expect(result.user.provider).toBe("google");
  });

  it("session callback is a no-op when there is no session.user", async () => {
    const session: any = {};
    const token: any = { provider: "google" };

    const result = await authOptions.callbacks.session({ session, token });

    expect(result.user).toBeUndefined();
  });
});
