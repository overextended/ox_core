local MySQL = MySQL
local db = {}

local SELECT_GROUPS = 'SELECT * FROM `ox_groups`'
---Fetch all groups from the database.
function db.selectGroups()
    return MySQL.query.await(SELECT_GROUPS)
end

local ADD_CHARACTER_TO_GROUP = 'INSERT INTO `character_groups` (`charid`, `name`, `grade`) VALUES (?, ?, ?)'
---Adds the group to the character.
---@param charid number
---@param name string
---@param grade number
function db.addCharacterGroup(charid, name, grade)
    MySQL.prepare(ADD_CHARACTER_TO_GROUP, { charid, name, grade })
end

local UPDATE_CHARACTER_GROUP = 'UPDATE `character_groups` SET `grade` = ? WHERE `charid` = ? AND `name` = ?'
---Update the character's grade for the given group.
---@param charid number
---@param name string
---@param grade number
function db.updateCharacterGroup(charid, name, grade)
    MySQL.prepare(UPDATE_CHARACTER_GROUP, { grade, charid, name })
end

local REMOVE_CHARACTER_FROM_GROUP = 'DELETE FROM `character_groups` WHERE `charid` = ? AND `name` = ?'
---Removes the group from the user.
---@param charid number
---@param name string
function db.removeCharacterGroup(charid, name)
    MySQL.prepare(REMOVE_CHARACTER_FROM_GROUP, { charid, name })
end

return db
