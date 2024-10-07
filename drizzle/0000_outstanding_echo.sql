CREATE TABLE IF NOT EXISTS "code_group_mappings" (
	"code_id" integer NOT NULL,
	"group_id" integer NOT NULL,
	CONSTRAINT "code_group_mappings_code_id_group_id_pk" PRIMARY KEY("code_id","group_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "codes" (
	"id" serial PRIMARY KEY NOT NULL,
	"system" varchar(255) NOT NULL,
	"code" varchar(255) NOT NULL,
	"display" text,
	"type" varchar(255) NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "metadata" (
	"code_id" integer PRIMARY KEY NOT NULL,
	"basis_id" integer
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "code_group_mappings" ADD CONSTRAINT "code_group_mappings_code_id_codes_id_fk" FOREIGN KEY ("code_id") REFERENCES "public"."codes"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "code_group_mappings" ADD CONSTRAINT "code_group_mappings_group_id_codes_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."codes"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "metadata" ADD CONSTRAINT "metadata_code_id_codes_id_fk" FOREIGN KEY ("code_id") REFERENCES "public"."codes"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "metadata" ADD CONSTRAINT "metadata_basis_id_codes_id_fk" FOREIGN KEY ("basis_id") REFERENCES "public"."codes"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "system_code_unique_idx" ON "codes" USING btree ("system","code");