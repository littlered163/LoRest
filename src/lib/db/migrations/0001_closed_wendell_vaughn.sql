CREATE TABLE "notification_prefs" (
	"user_id" varchar(128) PRIMARY KEY NOT NULL,
	"bedtime" boolean DEFAULT true NOT NULL,
	"checkup" boolean DEFAULT true NOT NULL,
	"weekly" boolean DEFAULT true NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "notification_prefs" ADD CONSTRAINT "notification_prefs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;