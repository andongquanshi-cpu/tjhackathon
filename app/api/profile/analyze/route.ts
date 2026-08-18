import { NextResponse } from "next/server";
import { generatePortraitReading } from "@/lib/portrait-analysis";
import { getProfile, setProfile } from "@/lib/store";

export async function POST() {
  const profile = getProfile();
  if (!profile?.sixDim?.axes) {
    return NextResponse.json(
      { error: "还没有测评结果，请先完成六维测评。" },
      { status: 400 }
    );
  }

  try {
    const result = await generatePortraitReading(profile);
    const next = {
      ...profile,
      updatedAt: new Date().toISOString(),
      sixDim: {
        ...profile.sixDim,
        aiReading: result.reading,
        aiReadingAt: new Date().toISOString(),
      },
    };
    setProfile(next);
    return NextResponse.json({ ...result, profile: next });
  } catch (err) {
    console.error("[api/profile/analyze]", err);
    return NextResponse.json({ error: "解读暂时写不出来，请稍后重试。" }, { status: 500 });
  }
}
