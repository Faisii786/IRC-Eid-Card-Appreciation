type CardRecord = {
  buffer: Buffer;
  createdAt: number;
};

const CARD_TTL_MS = 1000 * 60 * 10;
const cardStore = new Map<string, CardRecord>();

function cleanupExpiredCards() {
  const now = Date.now();
  for (const [id, record] of cardStore.entries()) {
    if (now - record.createdAt > CARD_TTL_MS) {
      cardStore.delete(id);
    }
  }
}

export function saveGeneratedCard(id: string, buffer: Buffer) {
  cleanupExpiredCards();
  cardStore.set(id, { buffer, createdAt: Date.now() });
}

export function getGeneratedCard(id: string): Buffer | null {
  cleanupExpiredCards();
  const record = cardStore.get(id);
  if (!record) return null;
  return record.buffer;
}
