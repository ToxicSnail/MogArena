import { readFile } from "node:fs/promises";
import path from "node:path";
import { beforeAll,describe,expect,it } from "vitest";
import type { ImportedProfile } from "@prisma/client";
import { FixtureProfilePageFetcher,FixtureProfilePhotoFetcher } from "@/server/external/tsu/fixture-fetcher";
import { ensureFixtureImages } from "@/server/external/tsu/fixture-images";
import { ProfileParser } from "@/server/external/tsu/profile-parser";
import type { ImportedProfileRepository,ValidImportedPhoto } from "@/server/repositories/imported-profile-repository";
import { ExternalProfileImporter } from "@/server/services/external-profile-importer";
import { ProfilePhotoClassifier } from "@/server/services/profile-photo-classifier";
import type { StorageProvider } from "@/server/storage/storage-provider";

class Repo implements ImportedProfileRepository { statuses=new Map<string,string>(); async find(id:string){return this.statuses.has(id)?({externalId:id} as ImportedProfile):null;} async saveStatus(input:{externalId:string;status:string}){this.statuses.set(input.externalId,input.status);} async saveValid(input:ValidImportedPhoto){this.statuses.set(input.externalId,"VALID_PHOTO");return true;} }
class Storage implements StorageProvider { async put(_:Buffer,o:{namespace:string}){return{key:`${o.namespace}/x.webp`,url:`/${o.namespace}/x.webp`};} async read(){return Buffer.alloc(0);} async delete(){} }
let importer:ExternalProfileImporter;let repo:Repo;
beforeAll(async()=>{await ensureFixtureImages();const classifier=new ProfilePhotoClassifier({threshold:6});await classifier.addPlaceholderReference(await readFile(path.resolve("fixtures/images/placeholder.jpg")));repo=new Repo();importer=new ExternalProfileImporter(new FixtureProfilePageFetcher(),new ProfileParser(),new FixtureProfilePhotoFetcher(),classifier,repo,new Storage(),{concurrency:2,delayMs:0});});
describe("ExternalProfileImporter",()=>{
  it("imports real photos and classifies fixture states",async()=>{const summary=await importer.importMany(["99999999999999999991","99999999999999999992","99999999999999999993","404"]);expect(summary).toMatchObject({processed:4,imported:1,placeholder:1,noPhoto:1,notFound:1,errors:0});});
  it("uses cache on repeated import",async()=>expect((await importer.importOne("99999999999999999991")).status).toBe("CACHED"));
});
