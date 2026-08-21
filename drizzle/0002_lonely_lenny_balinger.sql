CREATE TABLE `imageBlobs` (
	`key` varchar(512) NOT NULL,
	`mimeType` varchar(255) NOT NULL,
	`data` longblob NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `imageBlobs_key` PRIMARY KEY(`key`)
);
