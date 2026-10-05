import { NextResponse } from 'next/server';
import { readdirSync } from 'fs';
import path from 'path';

// Scans public/tour-assets/{folder}/bgN.ext and reports the highest N found
// per folder, so the frontend never needs a hardcoded frame count.

export const dynamic = 'force-static';

const TOUR_ASSETS_DIR = path.join(process.cwd(), 'public', 'tour-assets');
const FRAME_PATTERN = /^bg(\d+)\.\w+$/i;

export async function GET() {
  const frames: Record<string, number> = {};

  let folders: string[] = [];
  try {
    folders = readdirSync(TOUR_ASSETS_DIR, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name);
  } catch {
    return NextResponse.json({ frames });
  }

  for (const folder of folders) {
    let files: string[] = [];
    try {
      files = readdirSync(path.join(TOUR_ASSETS_DIR, folder));
    } catch {
      continue;
    }

    let maxFrame = 0;
    for (const file of files) {
      const match = file.match(FRAME_PATTERN);
      if (match) maxFrame = Math.max(maxFrame, parseInt(match[1], 10));
    }
    frames[folder] = maxFrame;
  }

  return NextResponse.json({ frames }, { headers: { 'Cache-Control': 'no-store' } });
}
