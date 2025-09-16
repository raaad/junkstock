import { blobToDataUrl, fetchToBlob } from './file';
import { throwIt } from './throw-it';

// #region ecrypt/decrypt

/** Encrypt (AES-GCM) string with the provided string key */
export async function encrypt(message: string, password: string, crypto = defaultCrypto()) {
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const salt = crypto.getRandomValues(new Uint8Array(16));

  const key = await getKey(password, salt, crypto.subtle);

  const data = new TextEncoder().encode(message);

  const encrypted = new Uint8Array(
    await crypto.subtle.encrypt(
      {
        iv,
        name: 'AES-GCM'
      },
      key,
      data
    )
  );

  return await wrap(salt, iv, encrypted);
}

/** Decrypt (AES-GCM) string with the provided string key */
export async function decrypt(message: string, password: string, crypto = defaultCrypto().subtle) {
  const { salt, iv, data } = await unwrap(message);

  const key = await getKey(password, salt, crypto);

  const decrypted = new Uint8Array(
    await crypto.decrypt(
      {
        iv,
        name: 'AES-GCM'
      },
      key,
      data
    )
  );

  return new TextDecoder().decode(decrypted);
}

// #region support

/** Generate a CryptoKey (AES-GCM) from the provided text key */
async function getKey(key: string, salt: BufferSource, crypto: SubtleCrypto) {
  const baseKey = await crypto.importKey('raw', new TextEncoder().encode(key), 'PBKDF2', false, ['deriveKey']);

  return await crypto.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 10000,
      hash: 'SHA-256'
    },
    baseKey,
    {
      name: 'AES-GCM',
      length: 256
    },
    false,
    ['encrypt', 'decrypt']
  );
}

/** Prepend salt and initialization vector to encrypted data and return all as DataURL string */
async function wrap(salt: Uint8Array, iv: Uint8Array, data: Uint8Array) {
  const buf = new Uint8Array(salt.byteLength + iv.byteLength + data.byteLength);

  buf.set(salt, 0);
  buf.set(iv, salt.byteLength);
  buf.set(data, salt.byteLength + iv.byteLength);

  const blob = new Blob([buf], { type: 'application/octet-binary' });
  return await blobToDataUrl(blob);
}

/** Extract salt, initialization and encrypted data from DataURL string */
async function unwrap(dataUrl: string) {
  const buf = new Uint8Array(await (await fetchToBlob(dataUrl)).arrayBuffer());

  const salt = buf.slice(0, 16);
  const iv = buf.slice(16, 16 + 12);
  const data = buf.slice(16 + 12);

  return { salt, iv, data };
}

function defaultCrypto() {
  return window.crypto ?? throwIt('Crypto is not available');
}

// #endregion

// #endregion

export async function sha256(string: string, crypto = defaultCrypto().subtle) {
  const uint8 = new TextEncoder().encode(string);
  const hashBuffer = await crypto.digest('SHA-256', uint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
