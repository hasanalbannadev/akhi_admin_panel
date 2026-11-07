// Server page এ API বন্ধ থাকলেও যেন পুরো পেজ ভেঙে না পড়ে - fallback ফেরত দেয়।
export async function safe<T>(p: Promise<T>, fallback: T): Promise<T> {
  try { return await p; } catch { return fallback; }
}
