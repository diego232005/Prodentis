export function createId(prefix) {
  return `${prefix}-${crypto.randomUUID().slice(0, 8)}`
}
