import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join, sep } from "path";

export async function POST(req: Request) {
  try {
    const { path, dataUrl } = await req.json();
    if (typeof path !== "string" || path.includes("..")) {
      return NextResponse.json({ error: "Invalid path" }, { status: 400 });
    }
    const base64 = dataUrl.split(",")[1];
    if (!base64) {
      return NextResponse.json({ error: "Invalid dataUrl" }, { status: 400 });
    }

    const workspaceRoot = process.cwd().endsWith(`${sep}apps${sep}admin`)
      ? join(process.cwd(), "..", "..")
      : process.cwd();
    const fullPaths = [
      join(workspaceRoot, "apps", "admin", "public", path),
      join(workspaceRoot, "apps", "site", "public", path),
    ];

    await Promise.all(
      fullPaths.map(async (fullPath) => {
        await mkdir(fullPath.substring(0, fullPath.lastIndexOf("/")), {
          recursive: true,
        });
        await writeFile(fullPath, Buffer.from(base64, "base64"));
      }),
    );

    return NextResponse.json({ url: "/" + path });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
