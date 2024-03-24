/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;

/*!40101 SET NAMES utf8 */;

/*!50503 SET NAMES utf8mb4 */;

/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;

/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;

/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

CREATE DATABASE IF NOT EXISTS `overextended` DEFAULT CHARACTER
SET
  utf8mb4 COLLATE utf8mb4_unicode_ci;

USE `overextended`;

CREATE TABLE
  IF NOT EXISTS `users` (
    `userId` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `username` VARCHAR(50) DEFAULT NULL,
    `license2` VARCHAR(50) DEFAULT NULL,
    `steam` VARCHAR(20) DEFAULT NULL,
    `fivem` VARCHAR(10) DEFAULT NULL,
    `discord` VARCHAR(20) DEFAULT NULL,
    PRIMARY KEY (`userId`) USING BTREE
  );

CREATE TABLE
  IF NOT EXISTS `characters` (
    `charId` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `userId` INT UNSIGNED NOT NULL,
    `stateId` VARCHAR(7) NOT NULL,
    `firstName` VARCHAR(50) NOT NULL,
    `lastName` VARCHAR(50) NOT NULL,
    `gender` VARCHAR(10) NOT NULL,
    `dateOfBirth` DATE NOT NULL,
    `phoneNumber` VARCHAR(20) DEFAULT NULL,
    `lastPlayed` DATE NOT NULL DEFAULT (curdate()),
    `isDead` TINYINT(1) NOT NULL DEFAULT 0,
    `x` FLOAT DEFAULT NULL,
    `y` FLOAT DEFAULT NULL,
    `z` FLOAT DEFAULT NULL,
    `heading` FLOAT DEFAULT NULL,
    `health` TINYINT UNSIGNED DEFAULT NULL,
    `armour` TINYINT UNSIGNED DEFAULT NULL,
    `statuses` JSON NOT NULL DEFAULT (JSON_OBJECT()),
    `deleted` DATE NULL DEFAULT NULL,
    PRIMARY KEY (`charId`) USING BTREE,
    KEY `FK_character_users` (`userId`) USING BTREE,
    UNIQUE INDEX `stateId` (`stateId`) USING BTREE,
    CONSTRAINT `FK_characters_users` FOREIGN KEY (`userId`) REFERENCES `users` (`userId`) ON UPDATE CASCADE ON DELETE CASCADE
  );

CREATE TABLE
  IF NOT EXISTS `character_inventory` (
    `charId` INT UNSIGNED NOT NULL,
    `inventory` LONGTEXT NULL DEFAULT NULL,
    PRIMARY KEY (`charId`),
    KEY `FK_inventory_characters` (`charId`),
    CONSTRAINT `FK_inventory_characters` FOREIGN KEY (`charId`) REFERENCES `characters` (`charId`) ON UPDATE CASCADE ON DELETE CASCADE
  );

CREATE TABLE
  IF NOT EXISTS `ox_groups` (
    `name` VARCHAR(20) NOT NULL,
    `label` VARCHAR(50) NOT NULL,
    `grades` LONGTEXT NOT NULL,
    `hasAccount` TINYINT(1) NOT NULL DEFAULT 0,
    `adminGrade` TINYINT UNSIGNED NOT NULL DEFAULT json_length (`grades`),
    `colour` TINYINT UNSIGNED DEFAULT NULL,
    PRIMARY KEY (`name`) USING BTREE
  );

INSERT INTO
  `ox_groups` (
    `name`,
    `label`,
    `grades`,
    `hasAccount`,
    `adminGrade`,
    `colour`
  )
VALUES
  (
    'police',
    'Los Santos Police Department',
    '["Cadet", "Officer", "Sergeant", "Captain", "Commander", "Chief"]',
    b'0',
    6,
    NULL
  ),
  (
    'dispatch',
    'Police Dispatch',
    '["Dispatch"]',
    b'0',
    1,
    NULL
  );

CREATE TABLE
  IF NOT EXISTS `character_groups` (
    `charId` INT UNSIGNED NOT NULL,
    `name` VARCHAR(50) NOT NULL,
    `grade` TINYINT UNSIGNED NOT NULL,
    UNIQUE KEY `name` (`name`, `charId`) USING BTREE,
    KEY `FK_character_groups_characters` (`charId`) USING BTREE,
    CONSTRAINT `FK_character_groups_characters` FOREIGN KEY (`charId`) REFERENCES `characters` (`charId`) ON UPDATE CASCADE ON DELETE CASCADE
  );

CREATE TABLE
  IF NOT EXISTS `ox_inventory` (
    `owner` VARCHAR(60) DEFAULT NULL,
    `name` VARCHAR(60) NOT NULL,
    `data` LONGTEXT DEFAULT NULL,
    `lastupdated` timestamp NULL DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP(),
    UNIQUE KEY `owner` (`owner`, `name`)
  );

CREATE TABLE
  IF NOT EXISTS `vehicles` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `plate` CHAR(8) NOT NULL DEFAULT '',
    `vin` CHAR(17) NOT NULL,
    `owner` INT UNSIGNED NULL DEFAULT NULL,
    `group` VARCHAR(50) NULL DEFAULT NULL,
    `model` VARCHAR(20) NOT NULL,
    `class` TINYINT UNSIGNED NULL DEFAULT NULL,
    `data` LONGTEXT NOT NULL,
    `trunk` LONGTEXT NULL DEFAULT NULL,
    `glovebox` LONGTEXT NULL DEFAULT NULL,
    `stored` VARCHAR(50) NULL DEFAULT NULL,
    PRIMARY KEY (`id`) USING BTREE,
    UNIQUE INDEX `plate` (`plate`) USING BTREE,
    UNIQUE INDEX `vin` (`vin`) USING BTREE,
    INDEX `FK_vehicles_characters` (`owner`) USING BTREE,
    CONSTRAINT `FK_vehicles_characters` FOREIGN KEY (`owner`) REFERENCES `characters` (`charId`) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT `FK_vehicles_groups` FOREIGN KEY (`group`) REFERENCES `ox_groups` (`name`) ON UPDATE CASCADE ON DELETE CASCADE
  );

CREATE TABLE
  IF NOT EXISTS `ox_statuses` (
    `name` VARCHAR(20) NOT NULL,
    `default` TINYINT (3) UNSIGNED NOT NULL DEFAULT 0,
    `onTick` DECIMAL(4, 3) DEFAULT NULL
  );

INSERT INTO
  `ox_statuses` (`name`, `default`, `onTick`)
VALUES
  ('hunger', 0, 0.02),
  ('thirst', 0, 0.05),
  ('stress', 0, -0.10);

CREATE TABLE
  IF NOT EXISTS `character_licenses` (
    `charId` INT (10) UNSIGNED NOT NULL,
    `name` VARCHAR(20) DEFAULT NULL,
    `data` JSON NOT NULL DEFAULT (JSON_OBJECT()),
    UNIQUE KEY `name` (`name`, `charId`) USING BTREE,
    KEY `FK_character_licences_characters` (`charId`) USING BTREE,
    CONSTRAINT `FK_character_licences_characters` FOREIGN KEY (`charId`) REFERENCES `characters` (`charId`) ON DELETE CASCADE ON UPDATE CASCADE
  );

CREATE TABLE
  IF NOT EXISTS `ox_licenses` (
    `name` VARCHAR(20) NOT NULL,
    `label` VARCHAR(50) NOT NULL,
    UNIQUE INDEX `name` (`name`) USING BTREE
  );

INSERT INTO
  `ox_licenses` (`name`, `label`)
VALUES
  ('weapon', 'Weapon License'),
  ('driver', "Driver's License");

CREATE TABLE
  `accounts` (
    `id` INT (6) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `label` VARCHAR(50) NOT NULL,
    `owner` INT UNSIGNED NULL,
    `group` VARCHAR(20) NULL,
    `balance` INT DEFAULT 0 NOT NULL,
    `isDefault` TINYINT (1) DEFAULT 0 NOT NULL,
    `type` ENUM ('personal', 'shared', 'group') DEFAULT 'personal' NOT NULL,
    CONSTRAINT `FK_accounts_characters` FOREIGN KEY (`owner`) REFERENCES `characters` (`charId`) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT `FK_accounts_ox_groups` FOREIGN KEY (`group`) REFERENCES `ox_groups` (`name`) ON UPDATE CASCADE ON DELETE CASCADE
  ) AUTO_INCREMENT = 100000;

CREATE TABLE `accounts_access`
(
    `accountId` INT UNSIGNED                             NOT NULL,
    `charId`    INT UNSIGNED                             NOT NULL,
    `role`      ENUM ('contributor', 'manager', 'owner') NOT NULL,
    PRIMARY KEY (`accountId`, `charId`),
    CONSTRAINT `accounts_access_accounts_id_fk`
        FOREIGN KEY (`accountId`) REFERENCES `accounts` (`id`)
            ON DELETE CASCADE,
    CONSTRAINT `accounts_access_characters_charId_fk`
        FOREIGN KEY (`charId`) REFERENCES `characters` (`charId`)
            ON DELETE CASCADE
);

CREATE TABLE `accounts_transactions`
(
    `id`         INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `fromId`     INT UNSIGNED,
    `toId`       INT UNSIGNED,
    `amount`     INT          NOT NULL,
    `message`    VARCHAR(50),
    `date`       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    CONSTRAINT `accounts_transactions__fromId_fk`
        FOREIGN KEY (`fromId`) REFERENCES `accounts` (`id`)
            ON DELETE CASCADE,
    CONSTRAINT `accounts_transactions__toId_fk`
        FOREIGN KEY (`toId`) REFERENCES `accounts` (`id`)
            ON DELETE CASCADE
);

/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;

/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;

/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
