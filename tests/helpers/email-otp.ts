import * as imapSimple from 'imap-simple';
import { simpleParser } from 'mailparser';

const IMAP_CONFIG = {
  imap: {
    user: process.env.IMAP_USER || '',
    password: process.env.IMAP_PASSWORD || '',
    host: process.env.IMAP_HOST || 'imap.gmail.com',
    port: Number(process.env.IMAP_PORT) || 993,
    tls: true,
    tlsOptions: { rejectUnauthorized: false },
    authTimeout: 10000,
  },
};

/**
 * Menandai semua email OTP yang ada sebagai sudah dibaca,
 * agar tidak tercampur dengan OTP baru nanti.
 */
export async function clearOldOTPEmails(): Promise<void> {
  try {
    const connection = await imapSimple.connect(IMAP_CONFIG);
    await connection.openBox('INBOX');

    // Clear both login and change password OTP emails
    const searchCriteria = ['UNSEEN', ['SUBJECT', 'Kode OTP']];
    const fetchOptions = { bodies: ['HEADER'], markSeen: true, struct: true };

    await connection.search(searchCriteria, fetchOptions);
    await connection.end();
  } catch (error) {
    console.log('Warning: Could not clear old OTP emails:', error);
  }
}

/**
 * Mengambil kode OTP 6 digit dari email terbaru di inbox Gmail.
 * Akan retry beberapa kali dengan delay untuk menunggu email masuk.
 * @param subject - Subject email yang dicari (default: 'Kode OTP Login')
 */
export async function getOTPFromEmail(
  maxRetries: number = 15,
  delayMs: number = 3000,
  subject: string = 'Kode OTP Login'
): Promise<string> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const connection = await imapSimple.connect(IMAP_CONFIG);
      await connection.openBox('INBOX');

      const searchCriteria = [
        'UNSEEN',
        ['SUBJECT', subject],
      ];

      const fetchOptions = {
        bodies: [''],
        markSeen: true,
        struct: true,
      };

      const messages = await connection.search(searchCriteria, fetchOptions);

      if (messages.length > 0) {
        // Ambil email paling baru
        const latestMessage = messages[messages.length - 1];
        const body = latestMessage.parts.find((part: any) => part.which === '');

        if (body) {
          const parsed = await simpleParser(body.body);
          const text = parsed.text || parsed.html || '';

          // Cari kode OTP 6 digit
          const otpMatch = text.match(/\b(\d{6})\b/);
          if (otpMatch) {
            await connection.end();
            console.log(`OTP found on attempt ${attempt}: ${otpMatch[1]}`);
            return otpMatch[1];
          }
        }
      }

      await connection.end();
    } catch (error) {
      console.log(`Attempt ${attempt}: Error - ${error}`);
    }

    if (attempt < maxRetries) {
      console.log(`Attempt ${attempt}: OTP not found yet, waiting ${delayMs / 1000}s...`);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  throw new Error(`Failed to retrieve OTP after ${maxRetries} attempts`);
}
