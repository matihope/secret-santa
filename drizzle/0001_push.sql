CREATE TABLE `push_subscriptions` (
	`id` text PRIMARY KEY NOT NULL,
	`member_id` text NOT NULL,
	`endpoint` text NOT NULL,
	`p256dh` text NOT NULL,
	`auth` text NOT NULL,
	`locale` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `push_member_idx` ON `push_subscriptions` (`member_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `push_member_endpoint` ON `push_subscriptions` (`member_id`,`endpoint`);--> statement-breakpoint
ALTER TABLE `members` ADD `wishlist_changed_at` integer;--> statement-breakpoint
ALTER TABLE `parties` ADD `draw_reminder_for` integer;--> statement-breakpoint
ALTER TABLE `parties` ADD `party_reminder_for` integer;