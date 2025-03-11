ALTER TABLE "vde_maps" ADD COLUMN "rows" integer DEFAULT 10 NOT NULL;--> statement-breakpoint
ALTER TABLE "vde_maps" ADD COLUMN "columns" integer DEFAULT 10 NOT NULL;--> statement-breakpoint
ALTER TABLE "vde_maps" ADD COLUMN "base_size" integer DEFAULT 50 NOT NULL;