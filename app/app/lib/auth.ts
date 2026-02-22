import "server-only"
import { NextRequest } from "next/server";
import * as jose from "jose";
import { SLASHID_COOKIE } from "./utils";

const JWKS = jose.createRemoteJWKSet(
  new URL("https://api.slashid.com/.well-known/jwks.json")
);

export const requireToken = async (req: NextRequest): Promise<string> => {
  const token = req.cookies.get(SLASHID_COOKIE);

  if (!token) throw new Error("Missing token");

  return token.value
}

export const requireUserId = async (req: NextRequest): Promise<string> => {
  const token = await requireToken(req)
  const { payload } = await jose.jwtVerify(token, JWKS);

  if (!payload.sub) throw new Error("missing userId")

  return payload.sub;
};

