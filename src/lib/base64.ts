export const encodeBase64Utf8 = (value: string) =>
  btoa(String.fromCharCode(...new TextEncoder().encode(value)));

export const decodeBase64Utf8 = (value: string) =>
  new TextDecoder().decode(Uint8Array.from(atob(value.replace(/\n/g, "")), (char) => char.charCodeAt(0)));
