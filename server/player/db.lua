local MySQL = MySQL
local db = {}

local SELECT_USERID = string.format('SELECT userid FROM users WHERE %s = ?', Server.PRIMARY_IDENTIFIER)
---Select the userid for a player based on their identifier.
---@param identifier string
---@return number?
function db.getUserFromIdentifier(identifier)
    return MySQL.scalar.await(SELECT_USERID, { identifier })
end

local INSERT_USER = 'INSERT INTO users (username, license, steam, fivem, discord) VALUES (?, ?, ?, ?, ?)'
---Register a new user when a player first joins the server, and return their userid.
---@param username string
---@param identifiers {[string]: string}
---@return number?
function db.createUser(username, identifiers)
    return MySQL.prepare.await(INSERT_USER,
        { username, identifiers.license, identifiers.steam, identifiers.fivem, identifiers.discord })
end

local SELECT_CHARACTERS = 'SELECT charid, firstname, lastname, x, y, z, heading, DATE_FORMAT(last_played, "%d/%m/%Y") AS last_played FROM characters WHERE userid = ? AND deleted IS NULL'
---Select all characters owned by the player.
---@param userid number
---@return table
function db.selectCharacters(userid)
    return MySQL.query.await(SELECT_CHARACTERS, { userid }) or {}
end

local SELECT_CHARACTER_DATA = 'SELECT is_dead AS isDead, gender, DATE_FORMAT(dateofbirth, "%d/%m/%Y") AS dateofbirth, phone_number as phoneNumber FROM characters WHERE charid = ?'
---Select metadata for a character.
---@param charid any
---@return { isDead: boolean, gender: string, dateofbirth: string, phoneNumber: string }?
function db.selectCharacterData(charid)
    return MySQL.single.await(SELECT_CHARACTER_DATA, { charid })
end

local INSERT_CHARACTER = 'INSERT INTO characters (userid, firstname, lastname, gender, dateofbirth, phone_number) VALUES (?, ?, ?, ?, ?, ?)'
---Register a new character for the user and returns the charid.
---@param userid number
---@param firstName string
---@param lastName string
---@param gender string
---@param date number
---@param phone_number number?
---@return number?
function db.createCharacter(userid, firstName, lastName, gender, date, phone_number)
    return MySQL.prepare.await(INSERT_CHARACTER, { userid, firstName, lastName, gender, date, phone_number })
end

local UPDATE_CHARACTER = 'UPDATE characters SET x = ?, y = ?, z = ?, heading = ?, is_dead = ?, last_played = ? WHERE charid = ?'
---Update character data for one or multiple characters.
---@param parameters { [number]: any } | { [number]: any }[]
function db.updateCharacter(parameters)
    MySQL.prepare.await(UPDATE_CHARACTER, parameters)
end

local DELETE_CHARACTER = 'UPDATE characters SET deleted = curdate() WHERE charid = ?'
---Sets a character as deleted, preventing the user from accessing it.
---@param charid number
function db.deleteCharacter(charid)
    return MySQL.update(DELETE_CHARACTER, { charid })
end

local SELECT_CHARACTER_GROUPS = 'SELECT name, grade FROM user_groups WHERE charid = ?'
---Select all groups the character is a member of.
---@param charid number
---@return { name: string, grade: number }[]?
function db.selectCharacterGroups(charid)
    return MySQL.query.await(SELECT_CHARACTER_GROUPS, { charid })
end

local UPDATE_METADATA = 'UPDATE characters SET metadata = JSON_SET(metadata, ?, ?) WHERE charid = ?'
---Update metadata for character.
---@param parameters { key: string, value: unknown, charid: number }
function db.updateMetadata(parameters)
    MySQL.prepare.await(UPDATE_METADATA, parameters)
end

local SELECT_METADATA = 'SELECT metadata FROM characters where charid = ?'
---Update metadata for character.
---@param charid
---@return string?
function db.selectMetdata(charid)
    MySQL.query.await(SELECT_METADATA, charid)
end

return db
