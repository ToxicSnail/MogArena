import { ensureFixtureImages } from "../src/server/external/tsu/fixture-images";

ensureFixtureImages().then(() => process.stdout.write("Fixture images generated.\n"));
