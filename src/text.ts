import texts from "./texts.json";

export function tx(path: string): string {
  const parts = path.split(".");
  let cur: unknown = texts;
  for (const part of parts) {
    if (cur == null || typeof cur !== "object") return path;
    cur = (cur as Record<string, unknown>)[part];
  }
  return typeof cur === "string" ? cur : path;
}

export { texts };
export default texts;
