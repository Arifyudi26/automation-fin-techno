import * as fs from 'fs';
import * as path from 'path';

export default function globalSetup() {
  const screenshotsDir = path.resolve('screenshots');
  if (fs.existsSync(screenshotsDir)) {
    fs.rmSync(screenshotsDir, { recursive: true });
    console.log('Screenshots folder cleared.');
  }
}
