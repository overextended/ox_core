SET FOREIGN_KEY_CHECKS=0;

ALTER TABLE `characters` DROP FOREIGN KEY IF EXISTS `FK_characters_users`;
ALTER TABLE `character_inventory` DROP FOREIGN KEY IF EXISTS `FK_inventory_characters`;
ALTER TABLE `character_groups` DROP FOREIGN KEY IF EXISTS `FK_character_groups_characters`;
ALTER TABLE `character_licenses` DROP FOREIGN KEY IF EXISTS `FK_character_licences_characters`;
ALTER TABLE `vehicles` DROP FOREIGN KEY IF EXISTS `FK_vehicles_characters`;

ALTER TABLE `users` CHANGE COLUMN IF EXISTS `userid` `userId` INT UNSIGNED NOT NULL AUTO_INCREMENT;
ALTER TABLE `characters` CHANGE COLUMN IF EXISTS `userid` `userId` INT UNSIGNED;
ALTER TABLE `characters` CHANGE COLUMN IF EXISTS `charid` `charId` INT UNSIGNED NOT NULL AUTO_INCREMENT;
ALTER TABLE `characters` CHANGE COLUMN IF EXISTS `stateid` `stateId` VARCHAR(7);
ALTER TABLE `characters` CHANGE COLUMN IF EXISTS `firstname` `firstName` VARCHAR(50);
ALTER TABLE `characters` CHANGE COLUMN IF EXISTS `lastname` `lastName` VARCHAR(50);
ALTER TABLE `characters` CHANGE COLUMN IF EXISTS `dateofbirth` `dateOfBirth` DATE;
ALTER TABLE `characters` CHANGE COLUMN IF EXISTS `phone_number` `phoneNumber` VARCHAR(20);
ALTER TABLE `characters` CHANGE COLUMN IF EXISTS `last_played` `lastPlayed` DATE NOT NULL DEFAULT (curdate());
ALTER TABLE `characters` CHANGE COLUMN IF EXISTS `is_dead` `isDead` TINYINT NOT NULL DEFAULT 0;
ALTER TABLE `character_inventory` CHANGE COLUMN IF EXISTS `charid` `charId` INT UNSIGNED;
ALTER TABLE `character_groups` CHANGE COLUMN IF EXISTS `charid` `charId` INT UNSIGNED;
ALTER TABLE `character_licenses` CHANGE COLUMN IF EXISTS `charid` `charId` INT UNSIGNED;
ALTER TABLE `ox_groups` CHANGE COLUMN IF EXISTS `hasAccount` `hasAccount` TINYINT(1) NOT NULL DEFAULT 0;
ALTER TABLE `ox_statuses` CHANGE COLUMN IF EXISTS `ontick` `onTick` DECIMAL(4, 3) DEFAULT NULL;

ALTER TABLE `characters` ADD CONSTRAINT `FK_characters_users` FOREIGN KEY (`userId`) REFERENCES `users` (`userId`) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE `character_inventory` ADD CONSTRAINT `FK_inventory_characters` FOREIGN KEY (`charId`) REFERENCES `characters` (`charId`) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE `character_groups` ADD CONSTRAINT `FK_character_groups_characters` FOREIGN KEY (`charId`) REFERENCES `characters` (`charId`) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE `character_licenses` ADD CONSTRAINT `FK_character_licences_characters` FOREIGN KEY (`charId`) REFERENCES `characters` (`charId`) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE `vehicles` ADD CONSTRAINT `FK_vehicles_characters` FOREIGN KEY (`owner`) REFERENCES `characters` (`charId`) ON UPDATE CASCADE ON DELETE CASCADE;

SET FOREIGN_KEY_CHECKS=1;
