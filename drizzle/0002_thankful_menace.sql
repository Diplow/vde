DO $$ BEGIN
 CREATE TYPE "public"."map_owner" AS ENUM('user');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "deliberategg_events" (
	"id" integer PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY (sequence name "deliberategg_events_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"title" text NOT NULL,
	"description" text,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp NOT NULL,
	"author_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "deliberategg_map_resources" (
	"id" integer PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY (sequence name "deliberategg_map_resources_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"map_id" integer,
	"resource_id" integer
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "deliberategg_maps" (
	"id" integer PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY (sequence name "deliberategg_maps_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" text NOT NULL,
	"description" text,
	"owner_id" integer NOT NULL,
	"owner_type" "map_owner" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "deliberategg_events" ADD CONSTRAINT "deliberategg_events_author_id_deliberategg_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."deliberategg_users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "deliberategg_map_resources" ADD CONSTRAINT "deliberategg_map_resources_map_id_deliberategg_maps_id_fk" FOREIGN KEY ("map_id") REFERENCES "public"."deliberategg_maps"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "deliberategg_map_resources" ADD CONSTRAINT "deliberategg_map_resources_resource_id_deliberategg_resource_id_fk" FOREIGN KEY ("resource_id") REFERENCES "public"."deliberategg_resource"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "deliberategg_maps" ADD CONSTRAINT "deliberategg_maps_owner_id_deliberategg_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."deliberategg_users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
