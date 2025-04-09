import { ethers, id } from "ethers";
import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "./[...nextauth]";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const session = await getServerSession(req, res, authOptions);
  if (!session || Object.keys(session).length === 0) {
    return res.status(400).json({ error: "No session found" });
  }

  // Check if session.user exists
  if (!session.user) {
    return res.status(400).json({ error: "No user found in session" });
  }

  // Check if email exists
  if (!session.user.email) {
    return res.status(400).json({ error: "No email found in user session" });
  }

  const seed = ethers.hashMessage(
    (JSON.stringify(session.user) + process.env.NEXT_AUTH_SEED) as string,
  );
  const wallet = new ethers.Wallet(id(process.env.NEXT_AUTH_SEED as string));
  const signedEmail = await wallet.signMessage(session.user.email);

  res.status(200).json({ 
    seed, 
    email: session.user.email, 
    signedEmail, 
    userName: session.user.name || " " 
  });
}
