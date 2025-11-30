#!/usr/bin/env node

/*
  SVGロゴを各種PNGとfavicon.icoに変換するユーティリティ。
  依存: sharp, to-ico
  使い方:
    node scripts/generate-favicon.js public/Cg-logo.svg
*/

const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const toIco = require("to-ico");

async function main() {
	const input = process.argv[2] || "public/Cg-logo.svg";
	const inputAbs = path.resolve(process.cwd(), input);
	const outDir = path.resolve(process.cwd(), "public");

	if (!fs.existsSync(inputAbs)) {
		console.error(`Input not found: ${inputAbs}`);
		process.exit(1);
	}

	const sizes = [16, 32, 48, 64, 192, 512];
	const pngBuffers = [];

	for (const size of sizes) {
		const outPng = path.join(outDir, `favicon-${size}.png`);
		const png = await sharp(inputAbs, { density: 512 })
			.resize(size, size, { fit: "cover" })
			.png({ compressionLevel: 9 })
			.toBuffer();
		await fs.promises.writeFile(outPng, png);
		if (size <= 64) pngBuffers.push(png);
		console.log(`wrote ${path.relative(process.cwd(), outPng)}`);
	}

	// ICOは 16/32/48/64 を含める
	const icoBuffer = await toIco(pngBuffers);
	const icoPath = path.join(outDir, "favicon.ico");
	await fs.promises.writeFile(icoPath, icoBuffer);
	console.log(`wrote ${path.relative(process.cwd(), icoPath)}`);
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
