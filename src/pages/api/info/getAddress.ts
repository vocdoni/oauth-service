import { ethers, id } from "ethers";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const wallet = new ethers.Wallet(id(process.env.NEXT_AUTH_SEED as string));

  res.status(200).json({ address: wallet.address });
}
