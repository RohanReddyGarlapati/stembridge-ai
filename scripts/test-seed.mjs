import { createCLI } from "vitest/node";

process.env.CATALOG_SEED = "1";
createCLI().parse(["node", "vitest", "run", ...process.argv.slice(2)]);
