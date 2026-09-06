import { describe, expect, it } from "vitest";
import type { BattleStatus } from "@prisma/client";
import { AppError } from "@/server/errors";
import { VoteService, type VoteBattle, type VoteStore, type VoteTransaction } from "@/server/services/vote-service";

class FakeStore implements VoteStore,VoteTransaction {
  battle:VoteBattle|null={id:"battle",participantAId:"a",participantBId:"b",status:"ACTIVE",votesA:0,votesB:0,participantA:{rating:1000},participantB:{rating:1000}};
  votes=new Set<string>(); ratingsUpdated=false;
  async transaction<T>(operation:(tx:VoteTransaction)=>Promise<T>){return operation(this);}
  async getBattle(){return this.battle;}
  async hasVote(_:string,voterId:string){return this.votes.has(voterId);}
  async createVote(_:string,voterId:string){this.votes.add(voterId);}
  async incrementVotes(_:string,side:"A"|"B"){if(!this.battle)throw new Error(); if(side==="A")this.battle.votesA++;else this.battle.votesB++;return this.battle;}
  async closeBattleIfActive(){if(!this.battle||this.battle.status!=="ACTIVE")return false;this.battle.status="CLOSED";return true;}
  async updateRatings(){this.ratingsUpdated=true;}
}
async function code(promise:Promise<unknown>){try{await promise;}catch(error){return (error as AppError).code;}}

describe("VoteService",()=>{
  it("accepts a valid vote",async()=>{const store=new FakeStore();const result=await new VoteService(store,undefined,20).vote("battle","voter","a");expect(result.votesA).toBe(1);});
  it("rejects a duplicate vote",async()=>{const store=new FakeStore();store.votes.add("voter");expect(await code(new VoteService(store).vote("battle","voter","a"))).toBe("DUPLICATE_VOTE");});
  it("rejects a participant voter",async()=>{const store=new FakeStore();expect(await code(new VoteService(store).vote("battle","a","b"))).toBe("SELF_VOTE");});
  it("rejects a selection outside the battle",async()=>{const store=new FakeStore();expect(await code(new VoteService(store).vote("battle","voter","c"))).toBe("INVALID_SELECTION");});
  it("rejects a closed battle",async()=>{const store=new FakeStore();store.battle!.status="CLOSED" as BattleStatus;expect(await code(new VoteService(store).vote("battle","voter","a"))).toBe("BATTLE_CLOSED");});
  it("closes and updates rating at the target",async()=>{const store=new FakeStore();store.battle!.votesA=2;const result=await new VoteService(store,undefined,3).vote("battle","voter","a");expect(result.status).toBe("CLOSED");expect(store.ratingsUpdated).toBe(true);});
});
