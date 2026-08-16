import ProfileView from "@/components/ProfileView";
import { getProfile } from "@/lib/store";

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ new?: string }>;
}) {
  const { new: isNew } = await searchParams;
  return <ProfileView isNew={isNew === "1"} initialProfile={getProfile()} />;
}