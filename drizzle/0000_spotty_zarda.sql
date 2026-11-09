CREATE TYPE "public"."connection_status" AS ENUM('disconnected', 'connecting', 'connected', 'stale', 'expired', 'error');--> statement-breakpoint
CREATE TYPE "public"."draft_status" AS ENUM('draft', 'publishing', 'published', 'discarded');--> statement-breakpoint
CREATE TYPE "public"."fitness_experience" AS ENUM('beginner', 'intermediate', 'advanced');--> statement-breakpoint
CREATE TYPE "public"."planned_workout_status" AS ENUM('scheduled', 'completed', 'skipped', 'needs_review');--> statement-breakpoint
CREATE TYPE "public"."provider" AS ENUM('google', 'canvas', 'hevy');--> statement-breakpoint
CREATE TYPE "public"."task_category" AS ENUM('academic', 'recruiting', 'projects');--> statement-breakpoint
CREATE TYPE "public"."task_priority" AS ENUM('low', 'medium', 'high');--> statement-breakpoint
CREATE TYPE "public"."task_source" AS ENUM('build1', 'imported');--> statement-breakpoint
CREATE TYPE "public"."task_status" AS ENUM('open', 'completed', 'archived');--> statement-breakpoint
CREATE TYPE "public"."theme" AS ENUM('light', 'dark', 'system');--> statement-breakpoint
CREATE TABLE "activity_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"action" text NOT NULL,
	"target_type" text NOT NULL,
	"target_id" text NOT NULL,
	"summary" text NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "connected_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"provider" "provider" NOT NULL,
	"status" "connection_status" DEFAULT 'disconnected' NOT NULL,
	"encrypted_access_token" text,
	"encrypted_refresh_token" text,
	"token_expires_at" timestamp with time zone,
	"provider_account_id" text,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"last_sync_at" timestamp with time zone,
	"last_sync_error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event_drafts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" text NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"notes" text,
	"location" text,
	"status" "draft_status" DEFAULT 'draft' NOT NULL,
	"publish_key" text NOT NULL,
	"published_external_id" text,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "event_drafts_publish_key_unique" UNIQUE("publish_key"),
	CONSTRAINT "event_drafts_published_external_id_unique" UNIQUE("published_external_id")
);
--> statement-breakpoint
CREATE TABLE "external_assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"external_id" text NOT NULL,
	"course_id" text NOT NULL,
	"course_name" text NOT NULL,
	"title" text NOT NULL,
	"due_at" timestamp with time zone,
	"source_url" text,
	"state" text NOT NULL,
	"last_synced_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "external_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"provider" "provider" NOT NULL,
	"external_id" text NOT NULL,
	"container_id" text NOT NULL,
	"title" text NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"all_day" boolean DEFAULT false NOT NULL,
	"source_url" text,
	"is_read_only" boolean DEFAULT true NOT NULL,
	"last_synced_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fitness_profiles" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"experience" "fitness_experience" DEFAULT 'intermediate' NOT NULL,
	"goals" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"protected_sessions" integer DEFAULT 3 NOT NULL,
	"optional_session" boolean DEFAULT true NOT NULL,
	"preferred_durations" jsonb DEFAULT '[75,60]'::jsonb NOT NULL,
	"travel_before_minutes" integer DEFAULT 10 NOT NULL,
	"buffer_after_minutes" integer DEFAULT 20 NOT NULL,
	"earliest_start_hour" integer DEFAULT 10 NOT NULL,
	"curfew_hour" integer DEFAULT 20 NOT NULL,
	"curfew_days" jsonb DEFAULT '[3,5,6]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "planned_workouts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"template_id" uuid NOT NULL,
	"status" "planned_workout_status" DEFAULT 'scheduled' NOT NULL,
	"reserved_starts_at" timestamp with time zone NOT NULL,
	"lift_starts_at" timestamp with time zone NOT NULL,
	"lift_ends_at" timestamp with time zone NOT NULL,
	"reserved_ends_at" timestamp with time zone NOT NULL,
	"duration_minutes" integer NOT NULL,
	"calendar_external_id" text,
	"scheduling_reason" text NOT NULL,
	"decision_metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "planned_workouts_calendar_external_id_unique" UNIQUE("calendar_external_id")
);
--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" text NOT NULL,
	"category" "task_category" NOT NULL,
	"status" "task_status" DEFAULT 'open' NOT NULL,
	"due_date" timestamp with time zone,
	"priority" "task_priority",
	"estimated_minutes" integer,
	"notes" text,
	"source" "task_source" DEFAULT 'build1' NOT NULL,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "training_programs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" text NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone,
	"weekly_target" integer DEFAULT 3 NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_settings" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"time_zone" text DEFAULT 'America/New_York' NOT NULL,
	"theme" "theme" DEFAULT 'system' NOT NULL,
	"weather_location" text DEFAULT 'Washington, D.C.' NOT NULL,
	"weather_latitude" text DEFAULT '38.9072' NOT NULL,
	"weather_longitude" text DEFAULT '-77.0369' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"name" text,
	"image_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "workout_decisions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"planned_workout_id" uuid NOT NULL,
	"previous_status" "planned_workout_status" NOT NULL,
	"next_status" "planned_workout_status" NOT NULL,
	"reason" text,
	"actor" text DEFAULT 'user' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workout_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"program_id" uuid NOT NULL,
	"external_hevy_routine_id" text,
	"title" text NOT NULL,
	"focus" text NOT NULL,
	"is_protected" boolean DEFAULT true NOT NULL,
	"variants" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"position" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "connected_accounts" ADD CONSTRAINT "connected_accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_drafts" ADD CONSTRAINT "event_drafts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "external_assignments" ADD CONSTRAINT "external_assignments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "external_events" ADD CONSTRAINT "external_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fitness_profiles" ADD CONSTRAINT "fitness_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "planned_workouts" ADD CONSTRAINT "planned_workouts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "planned_workouts" ADD CONSTRAINT "planned_workouts_template_id_workout_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."workout_templates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_programs" ADD CONSTRAINT "training_programs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workout_decisions" ADD CONSTRAINT "workout_decisions_planned_workout_id_planned_workouts_id_fk" FOREIGN KEY ("planned_workout_id") REFERENCES "public"."planned_workouts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workout_templates" ADD CONSTRAINT "workout_templates_program_id_training_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."training_programs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "activity_log_user_time_idx" ON "activity_logs" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "connected_account_provider_unique" ON "connected_accounts" USING btree ("user_id","provider");--> statement-breakpoint
CREATE INDEX "event_draft_status_idx" ON "event_drafts" USING btree ("user_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "external_assignment_source_unique" ON "external_assignments" USING btree ("user_id","course_id","external_id");--> statement-breakpoint
CREATE UNIQUE INDEX "external_event_source_unique" ON "external_events" USING btree ("user_id","provider","container_id","external_id");--> statement-breakpoint
CREATE INDEX "external_event_time_idx" ON "external_events" USING btree ("user_id","starts_at");--> statement-breakpoint
CREATE INDEX "planned_workout_user_start_idx" ON "planned_workouts" USING btree ("user_id","reserved_starts_at");--> statement-breakpoint
CREATE INDEX "planned_workout_status_idx" ON "planned_workouts" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "task_status_category_idx" ON "tasks" USING btree ("user_id","status","category");--> statement-breakpoint
CREATE INDEX "training_program_user_active_idx" ON "training_programs" USING btree ("user_id","is_active");--> statement-breakpoint
CREATE INDEX "workout_decision_workout_time_idx" ON "workout_decisions" USING btree ("planned_workout_id","created_at");--> statement-breakpoint
CREATE INDEX "workout_template_program_position_idx" ON "workout_templates" USING btree ("program_id","position");