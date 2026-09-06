import path from "node:path";
import { createExternalProfileImporter } from "../src/server/external/tsu/importer-factory";
import { readProfileInput } from "../src/server/external/tsu/input";
import { db } from "../src/server/db/client";

async function main() {
  const args = process.argv.slice(2); const force = args.includes("--force"); const inputArg = args.find((arg) => !arg.startsWith("--")) ?? "data/profiles.txt";
  const ids = await readProfileInput(path.resolve(inputArg), process.env.PROFILE_IMPORT_ALLOWED_HOST ?? "accounts.tsu.ru");
  const importer = await createExternalProfileImporter();
  const summary = await importer.importMany(ids,force,(result,index) => process.stdout.write(`[${index+1}/${ids.length}] ${result.externalId} -> ${result.status}\n`));
  process.stdout.write(`\nProcessed: ${summary.processed}\nImported: ${summary.imported}\nPlaceholder: ${summary.placeholder}\nNo photo: ${summary.noPhoto}\nNot found: ${summary.notFound}\nCached: ${summary.cached}\nErrors: ${summary.errors}\n`);
  if (summary.errors) process.exitCode = 1;
}

main().catch((error) => { process.stderr.write(`Import stopped: ${error instanceof Error ? error.message : "Unknown error"}\n`); process.exitCode=1; }).finally(() => db.$disconnect());
