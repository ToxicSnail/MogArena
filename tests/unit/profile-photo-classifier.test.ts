import { readFile } from "node:fs/promises";
import path from "node:path";
import { beforeAll,describe,expect,it } from "vitest";
import { ensureFixtureImages } from "@/server/external/tsu/fixture-images";
import { ProfilePhotoClassifier } from "@/server/services/profile-photo-classifier";

const image=(name:string)=>readFile(path.resolve("fixtures/images",name));
let classifier:ProfilePhotoClassifier;
beforeAll(async()=>{await ensureFixtureImages();classifier=new ProfilePhotoClassifier({threshold:6});await classifier.addPlaceholderReference(await image("placeholder.jpg"));});
describe("ProfilePhotoClassifier",()=>{
  it("detects an exact placeholder",async()=>expect(classifier.classify(await image("placeholder.jpg"))).resolves.toBe("PLACEHOLDER"));
  it("detects a recompressed placeholder",async()=>expect(classifier.classify(await image("placeholder-recompressed.jpg"))).resolves.toBe("PLACEHOLDER"));
  it("detects the TSU placeholder URL",async()=>expect(classifier.classify(await image("real.jpg"),{url:"https://accounts.tsu.ru/Content/noAvatar.jpg?size=large",contentType:"image/jpeg"})).resolves.toBe("PLACEHOLDER"));
  it("accepts a real image",async()=>expect(classifier.classify(await image("real.jpg"))).resolves.toBe("REAL_PHOTO"));
  it("rejects HTML",async()=>expect(classifier.classify(await image("invalid.html"),{contentType:"text/html"})).resolves.toBe("INVALID_IMAGE"));
  it("rejects a broken image",async()=>expect(classifier.classify(await image("broken.jpg"))).resolves.toBe("INVALID_IMAGE"));
});
