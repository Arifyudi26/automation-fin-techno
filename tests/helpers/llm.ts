import Groq from 'groq-sdk';

function getGroq() {
  const apiKey = process.env.GROQ_API_KEY || '';
  if (!apiKey) throw new Error('GROQ_API_KEY tidak ditemukan di .env');
  return new Groq({ apiKey });
}

// Model aktif di Groq — coba dari yang terbaru
const TEXT_MODELS = [
  'llama-3.3-70b-versatile',
  'llama3-70b-8192',
  'llama3-8b-8192',
];

/**
 * Kirim prompt text ke Groq dan dapatkan response.
 * Otomatis fallback ke model lain kalau model pertama gagal.
 */
export async function askLLM(prompt: string): Promise<string> {
  const groq = getGroq();

  for (const model of TEXT_MODELS) {
    try {
      const response = await groq.chat.completions.create({
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0,
        max_tokens: 300,
      });
      return response.choices[0]?.message?.content || '';
    } catch (error: unknown) {
      const msg = (error as Error).message || '';
      // Model decommissioned atau not found — coba model berikutnya
      if (msg.includes('decommissioned') || msg.includes('not found') || msg.includes('404')) {
        console.log(`[LLM] Model ${model} unavailable, trying next...`);
        continue;
      }
      throw error;
    }
  }

  throw new Error('[LLM] Semua model gagal. Cek Groq dashboard untuk model yang available.');
}

/**
 * Cek apakah error adalah rate limit
 */
export function isRateLimitError(error: unknown): boolean {
  const msg = (error as Error)?.message || '';
  return msg.includes('429') || msg.includes('rate_limit') || msg.includes('quota');
}
