import { mkdtemp,rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import argon2 from "argon2";
import { PrismaClient } from "@prisma/client";
import sharp from "sharp";
import { afterAll,beforeAll,describe,expect,it } from "vitest";
import { LocalStorageProvider } from "@/server/storage/local-storage-provider";
import { normalizeImage } from "@/server/services/image-service";
import { pairKey } from "@/lib/utils";

const enabled=Boolean(process.env.TEST_DATABASE_URL);
const suite=describe.skipIf(!enabled);
suite("MVP PostgreSQL flow",()=>{
  const db=new PrismaClient({datasourceUrl:process.env.TEST_DATABASE_URL});let root="";const stamp=Date.now().toString();const battleIds:string[]=[];
  beforeAll(async()=>{root=await mkdtemp(path.join(tmpdir(),"mogvs-test-"));});
  afterAll(async()=>{if(battleIds.length)await db.battle.deleteMany({where:{id:{in:battleIds}}});await db.user.deleteMany({where:{username:{startsWith:`it_${stamp}`}}});await db.$disconnect();if(root)await rm(root,{recursive:true,force:true});});
  it("registers, verifies login, uploads, battles, votes and reads rating",async()=>{
    const hash=await argon2.hash("password123"); const users=[];
    for(let i=0;i<4;i++)users.push(await db.user.create({data:{username:`it_${stamp}_${i}`,email:`it_${stamp}_${i}@test.local`,passwordHash:hash}}));
    expect(await argon2.verify(users[0].passwordHash!,"password123")).toBe(true);
    const source=await sharp({create:{width:128,height:160,channels:3,background:"#2463eb"}}).jpeg().toBuffer();const image=await normalizeImage(source);const storage=new LocalStorageProvider(root);
    const photos=[];for(const user of users.slice(0,2)){const full=await storage.put(image.full,{namespace:"photos",extension:"webp"});const thumb=await storage.put(image.thumbnail,{namespace:"thumbs",extension:"webp"});photos.push(await db.photo.create({data:{userId:user.id,url:full.url,thumbnailUrl:thumb.url,source:"USER_UPLOAD"}}));}
    const battle=await db.battle.create({data:{participantAId:users[0].id,participantBId:users[1].id,photoAId:photos[0].id,photoBId:photos[1].id,normalizedPairKey:pairKey(users[0].id,users[1].id)}});
    battleIds.push(battle.id);
    await db.vote.create({data:{battleId:battle.id,voterId:users[2].id,selectedUserId:users[0].id}});
    await expect(db.vote.create({data:{battleId:battle.id,voterId:users[2].id,selectedUserId:users[0].id}})).rejects.toThrow();
    const leaderboard=await db.user.findMany({where:{id:{in:users.map((u)=>u.id)}},orderBy:{rating:"desc"}});expect(leaderboard).toHaveLength(4);
  });
});
