/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */
;

/*!40101 SET NAMES utf8 */
;

/*!50503 SET NAMES utf8mb4 */
;

/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */
;

/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */
;

/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */
;

-- ADDS metatable column for people who are too dumb to understand it and if so dont be fivem dev
-- ALTER TABLE `characters` ADD metadata JSON DEFAULT '{}' CHECK (JSON_VALID(`metadata`))
CREATE DATABASE IF NOT EXISTS `overextended`
/*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci */
;

USE `overextended`;

CREATE TABLE IF NOT EXISTS `users` (
  `userid` MEDIUMINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `username` VARCHAR(50) DEFAULT NULL,
  `license2` VARCHAR(50) DEFAULT NULL,
  `steam` VARCHAR(20) DEFAULT NULL,
  `fivem` VARCHAR(10) DEFAULT NULL,
  `discord` VARCHAR(20) DEFAULT NULL,
  PRIMARY KEY (`userid`) USING BTREE
);

CREATE TABLE IF NOT EXISTS `characters` (
  `charid` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `userid` MEDIUMINT UNSIGNED NOT NULL,
  `firstname` VARCHAR(50) NOT NULL,
  `lastname` VARCHAR(50) NOT NULL,
  `gender` VARCHAR(10) NOT NULL,
  `dateofbirth` DATE NOT NULL,
  `phone_number` VARCHAR(20) DEFAULT NULL,
  `last_played` DATE NOT NULL DEFAULT (curdate()),
  `is_dead` BIT NOT NULL DEFAULT 0,
  `x` FLOAT DEFAULT NULL,
  `y` FLOAT DEFAULT NULL,
  `z` FLOAT DEFAULT NULL,
  `heading` FLOAT DEFAULT NULL,
  `health` TINYINT UNSIGNED DEFAULT NULL,
  `armour` TINYINT UNSIGNED DEFAULT NULL,
  `statuses` JSON NOT NULL DEFAULT (JSON_OBJECT()),
  `deleted` DATE NULL DEFAULT NULL,
  PRIMARY KEY (`charid`) USING BTREE,
  KEY `FK_character_users` (`userid`) USING BTREE,
  CONSTRAINT `FK_characters_users` FOREIGN KEY (`userid`) REFERENCES `users` (`userid`) ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS `character_inventory` (
  `charid` INT UNSIGNED NOT NULL,
  `inventory` LONGTEXT NULL DEFAULT NULL,
  PRIMARY KEY (`charid`),
  KEY `FK_inventory_characters` (`charid`),
  CONSTRAINT `FK_inventory_characters` FOREIGN KEY (`charid`) REFERENCES `characters` (`charid`) ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS `ox_groups` (
  `name` VARCHAR(20) NOT NULL,
  `label` VARCHAR(50) NOT NULL,
  `grades` LONGTEXT NOT NULL,
  `hasAccount` BIT NOT NULL DEFAULT 0,
  `adminGrade` TINYINT UNSIGNED NOT NULL DEFAULT JSON_LENGTH(grades),
  PRIMARY KEY (`name`) USING BTREE
);

INSERT INTO `ox_groups` (`name`, `label`, `grades`)
VALUES (
    'police',
    'Los Santos Police Department',
    '["Cadet", "Officer", "Sergeant", "Captain", "Commander", "Chief"]'
  );

CREATE TABLE IF NOT EXISTS `character_groups` (
  `charid` INT UNSIGNED NOT NULL,
  `name` VARCHAR(50) NOT NULL,
  `grade` TINYINT UNSIGNED NOT NULL,
  UNIQUE KEY `name` (`name`, `charid`) USING BTREE,
  KEY `FK_character_groups_characters` (`charid`) USING BTREE,
  CONSTRAINT `FK_character_groups_characters` FOREIGN KEY (`charid`) REFERENCES `characters` (`charid`) ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS `ox_inventory` (
  `owner` VARCHAR(60) DEFAULT NULL,
  `name` VARCHAR(60) NOT NULL,
  `data` longtext DEFAULT NULL,
  `lastupdated` timestamp NULL DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP(),
  UNIQUE KEY `owner` (`owner`, `name`)
);

CREATE TABLE IF NOT EXISTS `vehicles` (
  `id` MEDIUMINT UNSIGNED NOT NULL AUTO_INCREMENT,
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
  CONSTRAINT `FK_vehicles_characters` FOREIGN KEY (`owner`) REFERENCES `overextended`.`characters` (`charid`) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT `FK_vehicles_groups` FOREIGN KEY (`group`) REFERENCES `overextended`.`ox_groups` (`name`) ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS `ox_statuses` (
  `name` VARCHAR(20) NOT NULL,
  `default` TINYINT(3) UNSIGNED NOT NULL DEFAULT 0,
  `ontick` DECIMAL(4, 3) DEFAULT NULL
);

INSERT INTO `ox_statuses` (`name`, `default`, `ontick`)
VALUES ('hunger', 0, 0.02),
  ('thirst', 0, 0.05),
  ('stress', 0, -0.10);

CREATE TABLE IF NOT EXISTS `character_licenses` (
  `charid` INT(10) UNSIGNED NOT NULL,
  `name` VARCHAR(20) DEFAULT NULL,
  `issued` DATE DEFAULT NULL,
  UNIQUE KEY `name` (`name`, `charid`) USING BTREE,
  KEY `FK_character_licences_characters` (`charid`) USING BTREE,
  CONSTRAINT `FK_character_licences_characters` FOREIGN KEY (`charid`) REFERENCES `characters` (`charid`) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS `ox_licenses` (
  `name` VARCHAR(20) NOT NULL,
  `label` VARCHAR(50) NOT NULL
);

INSERT INTO `ox_licenses` (`name`, `label`)
VALUES ('weapon', 'Weapon License'),
  ('driver', "Driver's License");

CREATE TRIGGER `characters_after_insert`
AFTER
INSERT ON `characters` FOR EACH ROW
INSERT INTO `character_inventory` (charid)
VALUES (NEW.charid);

/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */
;

/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */
;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */
;

/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */
;
