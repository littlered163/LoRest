CREATE TABLE "devices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar(128) NOT NULL,
	"name" varchar(120) NOT NULL,
	"model" varchar(60) DEFAULT 'Z1' NOT NULL,
	"bluetooth_name" varchar(120),
	"online" boolean DEFAULT true NOT NULL,
	"last_sync_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "pregnancy_profiles" ADD COLUMN "onboarded" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "devices" ADD CONSTRAINT "devices_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "devices_user_idx" ON "devices" USING btree ("user_id");