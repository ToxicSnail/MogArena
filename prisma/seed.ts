import argon2 from "argon2";
import { PrismaClient } from "@prisma/client";
import sharp from "sharp";
import { getStorageProvider } from "../src/server/storage";
import { pairKey } from "../src/lib/utils";
import { generateRandomUsername } from "../src/server/services/random-username";

const db = new PrismaClient();
const names = ["alex","stan","john","maya","nora","leo","sasha","river","dani","morgan","skye","jamie","robin","casey","taylor","avery","quinn","blake","reese","devon","kai","jules"];

async function seed() {
  if (process.env.NODE_ENV === "production" && process.env.ALLOW_DEMO_SEED !== "true") throw new Error("Demo seed is disabled in production");
  const passwordHash = await argon2.hash("demo12345", { type: argon2.argon2id });
  const storage = getStorageProvider();
  const users=[];
  for(let i=0;i<names.length;i+=1){
    const email=`${names[i]}@mogvs.local`;
    const user=await db.user.upsert({where:{email},create:{username:generateRandomUsername(),email,passwordHash,bio:"Here to make the hard calls.",rating:1000+(names.length-i)*43,wins:Math.max(0,24-i),losses:4+(i%7)},update:{},select:{id:true,username:true}});
    let photo=await db.photo.findFirst({where:{source:"SEED",sourceExternalId:`seed-${i}`,contentHash:`seed-${i}`}});
    if(!photo){
      const hue=(i*43)%360;
      const svg=Buffer.from(`<svg width="640" height="800" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="g" x2="1" y2="1"><stop stop-color="hsl(${hue},75%,63%)"/><stop offset="1" stop-color="hsl(${(hue+80)%360},70%,32%)"/></linearGradient></defs><rect width="640" height="800" fill="url(#g)"/><circle cx="320" cy="280" r="145" fill="#f3c5a2"/><path d="M65 800c25-235 130-335 255-335s230 100 255 335" fill="#172033"/><path d="M175 225c40-150 260-150 292 15-95-55-188-61-292-15" fill="#32261f"/><circle cx="270" cy="290" r="12"/><circle cx="370" cy="290" r="12"/><path d="M270 365q50 35 100 0" fill="none" stroke="#8d4c3c" stroke-width="10"/></svg>`);
      const fullBuffer=await sharp(svg).webp({quality:88}).toBuffer(); const thumbBuffer=await sharp(svg).resize(400,500,{fit:"cover"}).webp({quality:80}).toBuffer();
      const [full,thumb]=await Promise.all([storage.put(fullBuffer,{namespace:"seed",extension:"webp"}),storage.put(thumbBuffer,{namespace:"thumbs",extension:"webp"})]);
      photo=await db.photo.create({data:{userId:user.id,url:full.url,thumbnailUrl:thumb.url,source:"SEED",sourceExternalId:`seed-${i}`,contentHash:`seed-${i}`,active:true}});
      await db.user.update({where:{id:user.id},data:{avatarUrl:thumb.url}});
    }
    users.push({...user,photoId:photo.id});
  }

  for(let i=0;i<30;i+=1){
    const a=users[i%users.length]; const b=users[(i*3+5)%users.length];
    const participantB=b.id===a.id?users[(i+1)%users.length]:b;
    const voters=users.filter((user)=>user.id!==a.id&&user.id!==participantB.id).slice(0,4);
    const selected=voters.map((_,index)=>index<3?a.id:participantB.id);
    const id=`seed-battle-${i}`;
    if(!await db.battle.findUnique({where:{id}})) await db.battle.create({data:{id,participantAId:a.id,participantBId:participantB.id,photoAId:a.photoId,photoBId:participantB.photoId,normalizedPairKey:pairKey(a.id,participantB.id),status:i<10?"ACTIVE":"CLOSED",votesA:3,votesB:1,votes:{create:voters.map((voter,index)=>({voterId:voter.id,selectedUserId:selected[index]}))}}});
  }
  process.stdout.write("Seeded 22 users, 22 photos, 30 battles and 120 votes.\nDemo login: alex@mogvs.local / demo12345\n");
}

seed().finally(()=>db.$disconnect());
