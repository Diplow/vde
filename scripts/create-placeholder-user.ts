import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq } from "drizzle-orm";
import * as schema from "../src/server/db/schema"; // Import all schema objects
import { env } from "../src/env";

// Destructure users table from the imported schema
const { users } = schema;

async function main() {
  console.log("Connecting to database...");
  const connectionString = env.DATABASE_URL;
  if (!connectionString) {
    console.error("DATABASE_URL environment variable is not set.");
    process.exit(1);
  }

  // For a script, it's good practice to ensure connections are closed.
  // The `max: 1` option is good for scripts.
  const client = postgres(connectionString, { max: 1 });
  const db = drizzle(client, { schema }); // Pass the full schema here

  const userId = "1";
  const userEmail = `placeholder-${userId}@example.com`;

  try {
    console.log(
      `Attempting to create user with ID: ${userId} and email: ${userEmail}...`,
    );

    const existingUser = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (existingUser) {
      console.log(
        `User with ID ${userId} (email: ${existingUser.email}) already exists.`,
      );
      // Optionally, update the existing user if needed, or just exit.
      // For this script, we'll just confirm it exists.
      return;
    }

    console.log(`Inserting new user: ID=${userId}, Email=${userEmail}`);
    await db.insert(users).values({
      id: userId,
      email: userEmail,
      name: `Placeholder User ${userId}`,
      emailVerified: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    console.log(`Successfully created user with ID: ${userId}`);
  } catch (error) {
    console.error("Error during placeholder user script:", error);
    if (error instanceof Error && "code" in error) {
      // More specific error logging
      console.error("DB Error Code:", (error as any).code);
      console.error("DB Error Detail:", (error as any).detail);
    }
    process.exit(1);
  } finally {
    console.log("Closing database connection...");
    await client.end();
    console.log("Database connection closed.");
  }
}

main().catch((e) => {
  console.error("Unhandled error in main function execution:", e);
  process.exit(1);
});

// Need to add 'eq' to imports if not already there
// import { eq } from "drizzle-orm"; // Add this at the top if using 'eq'
// However, the select might not need it for this specific query structure, let's check Drizzle docs.
// Simpler check might be findFirst, which drizzle-orm/postgres-js supports.

// Corrected version for checking existing user and imports:
