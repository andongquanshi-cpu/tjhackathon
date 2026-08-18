import ProfileView from "@/components/ProfileView";
import AppNav from "@/components/AppNav";
import { currentDay, getProfile } from "@/lib/store";

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ new?: string }>;
}) {
  const { new: isNew } = await searchParams;
  const profile = getProfile();
  return (
    <>
      <AppNav day={currentDay(profile)} />
      <ProfileView isNew={isNew === "1"} initialProfile={profile} />
    </>
  );
}
