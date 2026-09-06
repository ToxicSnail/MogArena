import type { Metadata } from "next";
import { CalendarDays } from "lucide-react";
import { notFound } from "next/navigation";
import { Avatar } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { EditProfile } from "@/features/profile/edit-profile";
import { PhotoUpload } from "@/features/photo/photo-upload";
import { auth } from "@/server/auth/options";
import { AppError } from "@/server/errors";
import { ProfileService } from "@/server/services/profile-service";
import { winrate } from "@/lib/utils";

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }): Promise<Metadata> {
  const { username } = await params;
  try { const profile = await new ProfileService().getByUsername(username); return { title: `@${profile.username}` }; }
  catch { return { title: "Profile" }; }
}

export default async function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  let profile;
  try { profile = await new ProfileService().getByUsername(username); } catch (error) { if (error instanceof AppError && error.status === 404) notFound(); throw error; }
  const session = await auth();
  const own = session?.user.id === profile.id;
  return <div className="space-y-5"><Card className="overflow-hidden"><div className="h-32 bg-[linear-gradient(120deg,#1459db,#65a6ff)] sm:h-44" /><div className="px-5 pb-7 text-center sm:px-9"><div className="-mt-16 flex flex-col items-center"><Avatar src={profile.avatarUrl ?? profile.activePhoto?.thumbnailUrl} alt={profile.username} className="h-32 w-32 border-4 border-[var(--surface)] shadow-lg" /><div className="mt-3 flex items-center gap-1.5"><h1 className="text-2xl font-black">@{profile.username}</h1></div>{profile.bio && <p className="mt-4 max-w-lg whitespace-pre-wrap">{profile.bio}</p>}<p className="mt-3 flex items-center gap-1 text-xs text-[var(--muted)]"><CalendarDays className="h-4 w-4" />Joined {profile.createdAt.toLocaleDateString("en", { month: "long", year: "numeric" })}</p></div>
      <div className="mx-auto mt-7 grid max-w-xl grid-cols-4 divide-x rounded-2xl bg-[var(--background)] p-4"><div><b className="block text-xl text-[var(--primary)]">{profile.rating}</b><span className="text-xs text-[var(--muted)]">Mog Rating</span></div><div><b className="block text-xl">{profile.wins}</b><span className="text-xs text-[var(--muted)]">Wins</span></div><div><b className="block text-xl">{profile.losses}</b><span className="text-xs text-[var(--muted)]">Losses</span></div><div><b className="block text-xl">{winrate(profile.wins,profile.losses)}%</b><span className="text-xs text-[var(--muted)]">Winrate</span></div></div>
      <p className="mt-4 text-sm text-[var(--muted)]">{profile.voteCount.toLocaleString()} community votes cast</p>
      {own && <div className="mt-5 flex flex-wrap justify-center gap-2"><EditProfile bio={profile.bio} /><PhotoUpload kind="avatar" label="Change avatar" /><PhotoUpload kind="battle" label={profile.activePhoto ? "Replace battle photo" : "Add battle photo"} /></div>}</div></Card>
    {profile.activePhoto ? <Card className="p-5"><h2 className="mb-4 text-lg font-black">Active battle photo</h2><img src={profile.activePhoto.url} alt={`${profile.username} battle`} className="mx-auto aspect-[4/5] max-h-[620px] rounded-xl object-cover" /></Card> : <Card className="p-9 text-center"><h2 className="font-black">No active battle photo</h2><p className="mt-1 text-sm text-[var(--muted)]">{own ? "Upload one to appear in battles." : "This profile is not participating right now."}</p></Card>}
  </div>;
}
