import { connectToDatabase, closeDatabase } from "../src/lib/db";
import { runFullImport } from "../src/lib/pokemon-import";

async function main() {
  try {
    await connectToDatabase();
    await runFullImport();
    await closeDatabase();
    console.log("Import finished successfully");
    process.exit(0);
  } catch (error) {
    console.error("Import failed:", error);
    process.exit(1);
  }
}

main();
