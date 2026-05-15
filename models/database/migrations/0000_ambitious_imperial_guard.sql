CREATE TABLE `medicine` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`brand_name` text NOT NULL,
	`ingredient` text NOT NULL,
	`dosage` text NOT NULL,
	`photo` blob,
	`is_active` integer DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE `alarm` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`medicine_id` integer NOT NULL,
	`interval` integer NOT NULL,
	`start_at` integer NOT NULL,
	`is_enabled` integer DEFAULT true NOT NULL,
	FOREIGN KEY (`medicine_id`) REFERENCES `medicine`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `dose_log` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`alarm_id` integer NOT NULL,
	`scheduled_at` integer NOT NULL,
	`taken_at` integer,
	FOREIGN KEY (`alarm_id`) REFERENCES `alarm`(`id`) ON UPDATE no action ON DELETE cascade
);
