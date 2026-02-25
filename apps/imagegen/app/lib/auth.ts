import "server-only"
import { NextRequest } from "next/server";
import * as jose from "jose";
import { SLASHID_COOKIE } from "./utils";

const JWKS = jose.createRemoteJWKSet(
  new URL("https://api.slashid.com/.well-known/jwks.json")
);

export const AUTH_USER_ID_HEADER = "x-auth-user-id";
export const AUTH_PAYLOAD_HEADER = "x-auth-payload";
export const AUTH_EMAIL_HEADER = "x-auth-email";

export type AuthContext = {
  userId: string;
  email: string | null;
  payload: jose.JWTPayload;
}

const getEmailFromPayload = (payload: jose.JWTPayload): string | null => {
  const payloadRecord = payload as Record<string, unknown>;
  const directEmail = payloadRecord.email;
  if (typeof directEmail === "string" && directEmail.length > 0) {
    return directEmail;
  }

  const handles = payloadRecord.handles;
  if (!Array.isArray(handles)) {
    return null;
  }

  const emailHandle = handles.find(handle => handle.type === "email_address")
  return emailHandle?.value ?? null
}

export const requireToken = async (req: NextRequest): Promise<string> => {
  const token = req.cookies.get(SLASHID_COOKIE);
  if (!token) throw new Error("Missing token");

  return token.value
}

export const verifyToken = async (token: string): Promise<AuthContext> => {
  const { payload } = await jose.jwtVerify(token, JWKS);
  if (!payload.sub) throw new Error("missing userId");

  return {
    userId: payload.sub,
    email: getEmailFromPayload(payload),
    payload,
  };
}

export const authContextHeaders = (auth: AuthContext, inputHeaders: Headers): Headers => {
    const headers = new Headers(inputHeaders)
    
    headers.set(AUTH_USER_ID_HEADER, auth.userId);
    if (auth.email) {
      headers.set(AUTH_EMAIL_HEADER, auth.email);
    } else {
      headers.delete(AUTH_EMAIL_HEADER);
    }
    headers.set(AUTH_PAYLOAD_HEADER, JSON.stringify(auth.payload));

    return headers
}

export const requireAuthContext = (req: NextRequest): AuthContext => {
  const userId = req.headers.get(AUTH_USER_ID_HEADER);
  const email = req.headers.get(AUTH_EMAIL_HEADER);
  const payloadHeader = req.headers.get(AUTH_PAYLOAD_HEADER);

  if (!userId || !payloadHeader) {
    throw new Error("missing auth context");
  }

  const payload = JSON.parse(payloadHeader) as jose.JWTPayload;

  return {
    userId,
    email: email ?? getEmailFromPayload(payload),
    payload,
  };
}
