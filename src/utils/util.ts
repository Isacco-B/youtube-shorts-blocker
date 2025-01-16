export function logger(message: string, type?: "info" | "error"): void {
  const baseMessage = `[${new Date().toLocaleString()}] ${message}`;
  if (type === "error") {
    console.error(baseMessage);
  } else {
    console.log(baseMessage);
  }
}
