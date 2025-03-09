import { db } from "~/server/db";
import * as schema from "~/server/db/schema";

async function verifySchema() {
  console.log("Verifying database connection and schema...");

  try {
    // Check if we can access the tables
    console.log(
      "Tables in schema:",
      Object.keys(schema).filter((key) => !key.startsWith("_")),
    );

    // Try to query the maps table
    const maps = await db.query.maps.findMany({
      limit: 5,
    });
    console.log(`Successfully queried maps table. Found ${maps.length} maps.`);

    // Try to query the events table
    const events = await db.query.events.findMany({
      limit: 5,
    });
    console.log(
      `Successfully queried events table. Found ${events.length} events.`,
    );

    // Try to query the resources table
    const resources = await db.query.resources.findMany({
      limit: 5,
    });
    console.log(
      `Successfully queried resources table. Found ${resources.length} resources.`,
    );

    console.log("Schema verification completed successfully!");
  } catch (error) {
    console.error("Error verifying schema:", error);
    process.exit(1);
  }
}

verifySchema()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Unhandled error:", error);
    process.exit(1);
  });
