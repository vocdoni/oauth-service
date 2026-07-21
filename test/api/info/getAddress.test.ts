import { describe, expect, it } from "vitest";
import { ethers, id } from "ethers";
import handler from "@/pages/api/info/getAddress";

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

describe("getAddress", () => {
  it("returns the address derived from NEXT_AUTH_SEED", async () => {
    const res = createMockRes();

    await handler({} as any, res);

    const expectedWallet = new ethers.Wallet(id(process.env.NEXT_AUTH_SEED as string));
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ address: expectedWallet.address });
  });

  it("is deterministic across calls", async () => {
    const res1 = createMockRes();
    const res2 = createMockRes();

    await handler({} as any, res1);
    await handler({} as any, res2);

    expect(res1.body.address).toBe(res2.body.address);
  });
});
