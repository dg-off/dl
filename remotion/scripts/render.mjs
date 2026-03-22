import { readdirSync, existsSync } from 'fs';
import { execSync } from 'child_process';

const outDir = '../output/mp4';
const usedDir = `${outDir}/AA_USED_CLIPS`;
const reelPattern = /^reel_(\d{4})\.mp4$/;

const nums = [
  ...readdirSync(outDir),
  ...(existsSync(usedDir) ? readdirSync(usedDir) : []),
]
  .map(f => f.match(reelPattern))
  .filter(Boolean)
  .map(m => parseInt(m[1], 10));

const next = String((nums.length ? Math.max(...nums) : 0) + 1).padStart(4, '0');
const outFile = `../output/mp4/reel_${next}.mp4`;

console.log(`Rendering to ${outFile}`);
execSync(`npx remotion render DeadlockShort ${outFile}`, { stdio: 'inherit' });
