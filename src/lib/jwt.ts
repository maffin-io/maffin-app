import jwt from 'jsonwebtoken';
import { JwksClient } from 'jwks-rsa';
import type { JwtHeader, JwtPayload, SigningKeyCallback } from 'jsonwebtoken';

function getKey(header: JwtHeader, callback: SigningKeyCallback) {
  const client = new JwksClient({
    jwksUri: `https://${process.env.NEXT_PUBLIC_AUTH0_DOMAIN}/.well-known/jwks.json`,
  });

  client.getSigningKey(header.kid, (_, key) => {
    const signingKey = key?.getPublicKey();
    callback(null, signingKey);
  });
}

export async function verify(token: string): Promise<JwtPayload> {
  const verified: JwtPayload = await new Promise((resolve, reject) => {
    jwt.verify(token, getKey, {}, (err, decoded) => {
      if (err) {
        reject(err);
      } else {
        resolve(decoded as JwtPayload);
      }
    });
  });

  return verified;
}

export async function isPremium(token: string): Promise<boolean> {
  const decoded = jwt.decode(token) as JwtPayload;
  return decoded['https://maffin/roles'].includes('premium');
}
