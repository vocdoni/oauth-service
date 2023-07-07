import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "./[...nextauth]";
import { ethers } from "ethers";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const session = await getServerSession(req, res, authOptions);
  if (!session || Object.keys(session).length === 0) {
    return res.status(400).json({ error: "No session found" });
  }

  const oauthDataField = session.user?.email
    ? session.user.email
    : JSON.stringify(session.user);

  const seed = ethers.hashMessage(
    (oauthDataField + process.env.NEXT_AUTH_SEED) as string,
  );

  res.status(200).json({ seed });
}
