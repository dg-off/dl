/**
 * Copies portrait images from ../data/portraits/ into public/portraits/
 * so Remotion can serve them via staticFile().
 *
 * Run once (or after adding new heroes): npm run setup
 */
const fs = require("fs");
const path = require("path");

const src = path.resolve(__dirname, "../../data/portraits");
const dst = path.resolve(__dirname, "../public/portraits");

fs.mkdirSync(dst, { recursive: true });
fs.cpSync(src, dst, { recursive: true });

const count = fs.readdirSync(dst).length;
console.log(`✓ Copied ${count} portraits → ${dst}`);
