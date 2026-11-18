CREATE TABLE `adventures` (
 `user_id` text PRIMARY KEY NOT NULL,
 `save_json` text NOT NULL,
 `revision` integer DEFAULT 1 NOT NULL,
 `updated_at` integer NOT NULL,
 `shared` integer DEFAULT 0 NOT NULL,
 `hero_name` text NOT NULL,
 `power` integer DEFAULT 0 NOT NULL,
 `level` integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE INDEX `adventures_hall_idx` ON `adventures` (`shared`,`power`);
