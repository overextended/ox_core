local MySQL = MySQL
local db = {}

local SELECT_USERID = ('SELECT `userId` FROM `users` WHERE `%s` = ? LIMIT ?, 1;'):format(Server.PRIMARY_IDENTIFIER)
---Select the userId for a player based on their identifier.
---@param identifier string
---@param offset? number
---@return number?
function db.getUserFromIdentifier(identifier, offset)
    return MySQL.scalar.await(SELECT_USERID, { identifier, offset or 0 })
end

local INSERT_USER = 'INSERT INTO `users` (`username`, `license2`, `steam`, `fivem`, `discord`) VALUES (?, ?, ?, ?, ?)'
---Register a new user when a player first joins the server, and return their userId.
---@param username string
---@param identifiers {[string]: string}
---@return number
function db.createUser(username, identifiers)
    return MySQL.prepare.await(INSERT_USER,
        { username, identifiers.license2, identifiers.steam, identifiers.fivem, identifiers.discord }) --[[@as number]]
end

local SELECT_CHARACTERS = 'SELECT `charId`, `stateId`, `firstName`, `lastName`, `x`, `y`, `z`, `heading`, DATE_FORMAT(`lastPlayed`, "%d/%m/%Y") AS `lastPlayed` FROM `characters` WHERE `userId` = ? AND `deleted` IS NULL'
---Select all characters owned by the player.
---@param userId number
---@return table
function db.selectCharacters(userId)
    return MySQL.query.await(SELECT_CHARACTERS, { userId }) or {}
end

local SELECT_CHARACTER_DATA = 'SELECT `isDead`, `gender`, DATE_FORMAT(`dateOfBirth`, "%d/%m/%Y") AS `dateOfBirth`, `phoneNumber`, `health`, `armour`, `statuses` FROM `characters` WHERE `charId` = ?'
---Select metadata for a character.
---@param charId any
---@return { isDead: boolean, gender: string, dateOfBirth: string, phoneNumber: string, health?: number, armour?: number, statuses?: string }
function db.selectCharacterData(charId)
    return MySQL.single.await(SELECT_CHARACTER_DATA, { charId }) or {}
end

local INSERT_CHARACTER = 'INSERT INTO `characters` (`userId`, `stateId`, `firstName`, `lastName`, `gender`, `dateOfBirth`, `phoneNumber`) VALUES (?, ?, ?, ?, ?, ?, ?)'
local INSERT_CHARACTER_INVENTORY = 'INSERT INTO `character_inventory` (`charId`) VALUES (?)'
---Register a new character for the user and returns the charId.
---@param userId number
---@param stateId string
---@param firstName string
---@param lastName string
---@param gender string
---@param date number
---@param phoneNumber number?
---@return number
function db.createCharacter(userId, stateId, firstName, lastName, gender, date, phoneNumber)
    local charId = MySQL.prepare.await(INSERT_CHARACTER, { userId, stateId, firstName, lastName, gender, date, phoneNumber }) --[[@as number]]
    MySQL.prepare.await(INSERT_CHARACTER_INVENTORY, { charId })

    return charId
end

local UPDATE_CHARACTER = 'UPDATE characters SET `x` = ?, `y` = ?, `z` = ?, `heading` = ?, `isDead` = ?, `lastPlayed` = ?, `health` = ?, `armour` = ?, `statuses` = ? WHERE `charId` = ?'
---Update character data for one or multiple characters.
---@param parameters table<number, any> | table<number, any>[]
function db.updateCharacter(parameters)
    MySQL.prepare.await(UPDATE_CHARACTER, parameters)
end

local DELETE_CHARACTER = 'UPDATE `characters` SET `deleted` = curdate() WHERE `charId` = ?'
---Sets a character as deleted, preventing the user from accessing it.
---@param charId number
function db.deleteCharacter(charId)
    return MySQL.update.await(DELETE_CHARACTER, { charId })
end

local SELECT_CHARACTER_GROUPS = 'SELECT `name`, `grade` FROM `character_groups` WHERE `charId` = ?'
---Select all groups the character is a member of.
---@param charId number
---@return { name: string, grade: number }[]?
function db.selectCharacterGroups(charId)
    return MySQL.query.await(SELECT_CHARACTER_GROUPS, { charId })
end

local SELECT_CHARACTER_LICENSES = 'SELECT `name`, DATE_FORMAT(`issued`, "%d/%m/%Y") AS `issued` FROM `character_licenses` WHERE `charId` = ?'
---@param charId number
---@return { name: string, issued: string }[]?
function db.selectCharacterLicenses(charId)
    return MySQL.query.await(SELECT_CHARACTER_LICENSES, { charId })
end

local ADD_CHARACTER_LICENSE = 'INSERT INTO `character_licenses` (`charId`, `name`, `issued`) VALUES (?, ?, ?)'
---Adds the group to the character.
---@param charId number
---@param name string
---@param issued string
function db.addCharacterLicense(charId, name, issued)
    return MySQL.prepare.await(ADD_CHARACTER_LICENSE, { charId, name, issued })
end

local REMOVE_CHARACTER_LICENSE = 'DELETE FROM `character_licenses` WHERE `charId` = ? AND `name` = ?'
---Removes the group from the user.
---@param charId number
---@param name string
function db.removeCharacterLicense(charId, name)
    return MySQL.prepare.await(REMOVE_CHARACTER_LICENSE, { charId, name })
end

local SELECT_STATEID = 'SELECT 1 FROM `characters` WHERE stateId = ?'

---@param stateId string
function db.isStateIdAvailable(stateId)
    return not MySQL.scalar.await(SELECT_STATEID, { stateId })
end

local UPDATE_STATEID = 'UPDATE characters SET `stateId` = ? WHERE `charId` = ?'

---@param stateId string
---@param charId number
---@return string
function db.updateStateId(stateId, charId)
    return MySQL.update.await(UPDATE_STATEID, { stateId, charId }) and stateId
end

return db
