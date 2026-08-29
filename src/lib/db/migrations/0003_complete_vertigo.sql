CREATE TABLE "weight_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar(128) NOT NULL,
	"weight_kg" numeric(5, 1) NOT NULL,
	"recorded_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "devices" ADD COLUMN "settings" varchar(500);--> statement-breakpoint
ALTER TABLE "pregnancy_profiles" ADD COLUMN "pregnancy_start_date" date;--> statement-breakpoint
ALTER TABLE "pregnancy_profiles" ADD COLUMN "initial_weight_kg" numeric(5, 1);--> statement-breakpoint
ALTER TABLE "weight_logs" ADD CONSTRAINT "weight_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "weight_logs_user_idx" ON "weight_logs" USING btree ("user_id");