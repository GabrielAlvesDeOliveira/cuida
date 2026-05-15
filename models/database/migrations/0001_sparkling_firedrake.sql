PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_medicine` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`brand_name` text NOT NULL,
	`ingredient` text NOT NULL,
	`dosage` text NOT NULL,
	`photo` text,
	`is_active` integer DEFAULT true NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_medicine`("id", "brand_name", "ingredient", "dosage", "photo", "is_active") SELECT "id", "brand_name", "ingredient", "dosage", "photo", "is_active" FROM `medicine`;--> statement-breakpoint
DROP TABLE `medicine`;--> statement-breakpoint
ALTER TABLE `__new_medicine` RENAME TO `medicine`;--> statement-breakpoint
PRAGMA foreign_keys=ON;