local MySQL = MySQL
local db = {}

local SELECT_GROUPS = 'SELECT * FROM `ox_groups`'
---Fetch all groups from the database.
function db.selectGroups()
    return MySQL.query.await(SELECT_GROUPS)
end

local ADD_CHARACTER_TO_GROUP = 'INSERT INTO `character_groups` (`charId`, `name`, `grade`) VALUES (?, ?, ?)'
---Adds the group to the character.
---@param charId number
---@param name string
---@param grade number
function db.addCharacterGroup(charId, name, grade)
    MySQL.prepare(ADD_CHARACTER_TO_GROUP, { charId, name, grade })
end

local UPDATE_CHARACTER_GROUP = 'UPDATE `character_groups` SET `grade` = ? WHERE `charId` = ? AND `name` = ?'
---Update the character's grade for the given group.
---@param charId number
---@param name string
---@param grade number
function db.updateCharacterGroup(charId, name, grade)
    MySQL.prepare(UPDATE_CHARACTER_GROUP, { grade, charId, name })
end

local REMOVE_CHARACTER_FROM_GROUP = 'DELETE FROM `character_groups` WHERE `charId` = ? AND `name` = ?'
---Removes the group from the user.
---@param charId number
---@param name string
function db.removeCharacterGroup(charId, name)
    MySQL.prepare(REMOVE_CHARACTER_FROM_GROUP, { charId, name })
end

return db
