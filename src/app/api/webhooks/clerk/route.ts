import { Webhook } from "svix";
import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";
import { db } from "~/server/db"; // Your database connection
import { users } from "~/server/db/schema/users";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  // Verify the webhook signature
  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Missing svix headers", { status: 400 });
  }

  // Get the webhook secret from environment variables
  const secret = process.env.CLERK_WEBHOOK_SECRET;
  if (!secret) {
    return new Response("Missing webhook secret", { status: 500 });
  }

  // Get the body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Create a new Svix instance with your secret
  const wh = new Webhook(secret);
  let evt: WebhookEvent;

  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    return new Response("Invalid signature", { status: 400 });
  }

  // Handle the webhook
  const eventType = evt.type;

  if (eventType === "user.created" || eventType === "user.updated") {
    const { id, email_addresses, image_url, first_name, last_name } = evt.data;

    // Store or update user in your database
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.clerkId, id))
      .limit(1);

    if (existingUser.length === 0) {
      await db.insert(users).values({
        clerkId: id,
        email: email_addresses[0]?.email_address,
        imageUrl: image_url,
        firstName: first_name,
        lastName: last_name,
      });
    } else {
      await db
        .update(users)
        .set({
          email: email_addresses[0]?.email_address,
          imageUrl: image_url,
          firstName: first_name,
          lastName: last_name,
        })
        .where(eq(users.clerkId, id));
    }
  }

  return new Response("Webhook received", { status: 200 });
}
