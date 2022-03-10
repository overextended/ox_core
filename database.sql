/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

CREATE DATABASE IF NOT EXISTS `overextended` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci */;
USE `overextended`;

CREATE TABLE IF NOT EXISTS `users` (
  `userid` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(50) DEFAULT NULL,
  `license` varchar(50) DEFAULT NULL,
  `steam` varchar(20) DEFAULT NULL,
  `fivem` varchar(10) DEFAULT NULL,
  `discord` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`userid`) USING BTREE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `characters` (
  `charid` int(11) NOT NULL AUTO_INCREMENT,
  `userid` int(11) NOT NULL,
  `firstname` varchar(50) NOT NULL,
  `lastname` varchar(50) NOT NULL,
  `gender` varchar(50) NOT NULL,
  `dateofbirth` date NOT NULL,
  `phone_number` varchar(20) NOT NULL,
  `last_played` date NOT NULL DEFAULT curdate(),
  `is_dead` tinyint(1) NOT NULL DEFAULT 0,
  `x` float DEFAULT NULL,
  `y` float DEFAULT NULL,
  `z` float DEFAULT NULL,
  `heading` float DEFAULT NULL,
  `inventory` longtext NOT NULL DEFAULT '[]',
  PRIMARY KEY (`charid`) USING BTREE,
  KEY `FK_character_users` (`userid`) USING BTREE,
  CONSTRAINT `FK_characters_users` FOREIGN KEY (`userid`) REFERENCES `users` (`userid`) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `user_accounts` (
  `charid` int(11) NOT NULL,
  `name` varchar(50) NOT NULL,
  `amount` int(11) NOT NULL DEFAULT 0,
  UNIQUE KEY `name` (`name`,`charid`) USING BTREE,
  KEY `FK_user_accounts_characters` (`charid`) USING BTREE,
  CONSTRAINT `FK_user_accounts_characters` FOREIGN KEY (`charid`) REFERENCES `characters` (`charid`) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `user_groups` (
  `charid` int(11) NOT NULL,
  `name` varchar(50) NOT NULL,
  `rank` int(11) NOT NULL,
  UNIQUE KEY `name` (`name`,`charid`) USING BTREE,
  KEY `FK_user_groups_characters` (`charid`) USING BTREE,
  CONSTRAINT `FK_user_groups_characters` FOREIGN KEY (`charid`) REFERENCES `characters` (`charid`) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `ox_inventory` (
  `owner` varchar(60) DEFAULT NULL,
  `name` varchar(60) NOT NULL,
  `data` longtext DEFAULT NULL,
  `lastupdated` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  UNIQUE KEY `owner` (`owner`,`name`)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `user_vehicles` (
  `plate` char(8) NOT NULL DEFAULT '',
  `charid` int(11) NOT NULL,
  `type` varchar(10) NOT NULL DEFAULT 'automobile',
  `x` float DEFAULT NULL,
  `y` float DEFAULT NULL,
  `z` float DEFAULT NULL,
  `heading` float DEFAULT NULL,
  `data` longtext NOT NULL,
  `trunk` longtext DEFAULT NULL,
  `glovebox` longtext DEFAULT NULL,
  `stored` varchar(50) NOT NULL DEFAULT 'false',
  PRIMARY KEY (`plate`),
  KEY `FK_user_vehicles_characters` (`charid`) USING BTREE,
  CONSTRAINT `FK_user_vehicles_characters` FOREIGN KEY (`charid`) REFERENCES `characters` (`charid`) ON DELETE CASCADE
) ENGINE=InnoDB;

/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
