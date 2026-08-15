import ProfileView from "@/components/ProfileView";

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ new?: string }>;
}) {
  const { new: isNew } = await searchParams;
  return <ProfileView isNew={isNew === "1"} />;
}