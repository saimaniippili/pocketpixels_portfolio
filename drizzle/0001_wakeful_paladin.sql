CREATE TABLE `galleryImages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`imageUrl` text NOT NULL,
	`imageKey` varchar(512) NOT NULL,
	`category` varchar(64) NOT NULL DEFAULT 'landscapes',
	`displayOrder` int NOT NULL DEFAULT 0,
	`isPublished` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `galleryImages_id` PRIMARY KEY(`id`)
);
