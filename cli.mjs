import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { select } from '@inquirer/prompts';

const TESTS_DIR = './tests';

// Recursively scan test files and folders
function scanTests(dir, prefix = '') {
  const items = fs.readdirSync(dir);
  const folders = [];
  const files = [];

  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory() && item !== 'helpers') {
      // Count spec files in this folder recursively
      const specCount = countSpecFiles(fullPath);
      if (specCount > 0) {
        folders.push({
          name: item,
          path: fullPath,
          specCount,
        });
      }
    } else if (stat.isFile() && item.endsWith('.spec.ts')) {
      files.push({
        name: item.replace('.spec.ts', ''),
        path: fullPath,
      });
    }
  }

  return { folders, files };
}

function countSpecFiles(dir) {
  let count = 0;
  const items = fs.readdirSync(dir);
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    if (stat.isFile() && item.endsWith('.spec.ts')) {
      count++;
    } else if (stat.isDirectory() && item !== 'helpers') {
      count += countSpecFiles(fullPath);
    }
  }
  return count;
}

async function main() {
  console.log('\n🧪 Fin-Techno Test Automation\n');

  let currentDir = TESTS_DIR;
  let selected = await showMenu(currentDir);

  while (selected) {
    if (selected === 'all') {
      runTest('');
      break;
    } else if (selected.type === 'folder') {
      selected = await showFolderMenu(selected.path, selected.name);
    } else if (selected.type === 'file') {
      runTest(selected.path);
      break;
    } else if (selected.type === 'run-folder') {
      runTest(selected.path);
      break;
    } else {
      break;
    }
  }
}

async function showMenu(dir) {
  const { folders, files } = scanTests(dir);

  if (folders.length === 0 && files.length === 0) {
    console.log('❌ Tidak ada file test ditemukan di folder tests/');
    process.exit(1);
  }

  const choices = [
    { name: '🚀 Jalankan Semua Test', value: 'all' },
  ];

  for (const folder of folders) {
    choices.push({
      name: `📁 ${folder.name}/ (${folder.specCount} test files)`,
      value: { type: 'folder', path: folder.path, name: folder.name },
    });
  }

  for (const file of files) {
    choices.push({
      name: `📄 ${file.name}`,
      value: { type: 'file', path: file.path },
    });
  }

  return await select({
    message: 'Pilih test yang ingin dijalankan:',
    choices,
  });
}

async function showFolderMenu(folderPath, folderName) {
  const { folders, files } = scanTests(folderPath);

  const choices = [
    { name: `🚀 Jalankan semua test di ${folderName}/`, value: { type: 'run-folder', path: folderPath } },
  ];

  for (const folder of folders) {
    choices.push({
      name: `📁 ${folder.name}/ (${folder.specCount} test files)`,
      value: { type: 'folder', path: folder.path, name: folder.name },
    });
  }

  for (const file of files) {
    choices.push({
      name: `📄 ${file.name}`,
      value: { type: 'file', path: file.path },
    });
  }

  choices.push({ name: '⬅️  Kembali', value: { type: 'back' } });

  const selected = await select({
    message: `📁 ${folderName}/ — Pilih test:`,
    choices,
  });

  if (selected.type === 'back') {
    return await showMenu(TESTS_DIR);
  }

  return selected;
}

function runTest(testPath) {
  console.log('\n⏳ Menjalankan test...\n');
  try {
    // Normalize path to forward slashes for Playwright on Windows
    const normalizedPath = testPath ? testPath.split(path.sep).join('/') : '';
    const cmd = normalizedPath
      ? `npx playwright test "${normalizedPath}" --reporter=list`
      : 'npx playwright test --reporter=list';
    execSync(cmd, { stdio: 'inherit', cwd: process.cwd() });
  } catch (error) {
    process.exit(1);
  }
}

main();
