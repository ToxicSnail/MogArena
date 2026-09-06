import { describe, expect, it } from "vitest";
import { BattleMatcher, type BattleMatcherRepository, type BattleParticipant } from "@/server/services/battle-matcher";
import { pairKey } from "@/lib/utils";

const participant=(id:string,active=true):BattleParticipant=>({id,username:id,displayName:null,rating:1000,photo:{id:`photo-${id}`,url:"/x",thumbnailUrl:active?"/x":"/inactive"}});
class Repo implements BattleMatcherRepository { constructor(private people:BattleParticipant[],private recent:string[]=[]){ } async activeParticipants(exclude:string[]){return this.people.filter((p)=>!exclude.includes(p.id)&&p.photo.thumbnailUrl!=="/inactive");} async recentPairKeys(){return this.recent;} }

describe("BattleMatcher",()=>{
  it("returns different participants",async()=>{const pair=await new BattleMatcher(new Repo([participant("a"),participant("b")]),()=>0.5).match("viewer");expect(pair.participantA.id).not.toBe(pair.participantB.id);});
  it("excludes current user",async()=>{const pair=await new BattleMatcher(new Repo([participant("viewer"),participant("b"),participant("c")]),()=>0.5).match("viewer");expect([pair.participantA.id,pair.participantB.id]).not.toContain("viewer");});
  it("uses only active photos",async()=>{const pair=await new BattleMatcher(new Repo([participant("inactive",false),participant("b"),participant("c")]),()=>0.5).match("viewer");expect([pair.participantA.id,pair.participantB.id]).not.toContain("inactive");});
  it("avoids an immediate repeated pair",async()=>{const pair=await new BattleMatcher(new Repo([participant("a"),participant("b"),participant("c")],[pairKey("a","b")]),()=>0.5).match("viewer");expect(pairKey(pair.participantA.id,pair.participantB.id)).not.toBe(pairKey("a","b"));});
  it("avoids recently shown participants",async()=>{const pair=await new BattleMatcher(new Repo([participant("a"),participant("b"),participant("c"),participant("d")]),()=>0.5).match("viewer",["a","b"]);expect([pair.participantA.id,pair.participantB.id].sort()).toEqual(["c","d"]);});
  it("reports exhaustion instead of prematurely repeating participants",async()=>{await expect(new BattleMatcher(new Repo([participant("a"),participant("b"),participant("c")]),()=>0.5).match("viewer",["a","b"])).rejects.toMatchObject({code:"NO_MATCH"});});
});
