local CGroup = Class.new('CGroup')

---Adds a player to a group and grants permissions based on their grade.
---@param player CPlayer
---@param grade number
function CGroup:add(player, grade)
    lib.addPrincipal(player.source, ('%s:%s'):format(self.principal, grade))
    local playerGroups = player.get('groups')
    playerGroups[self.name] = grade
    GlobalState[('%s:count'):format(self.name)] += 1
end

---Removes a player from a group and revokes permissions.
---@param player CPlayer
---@param grade number
function CGroup:remove(player, grade)
    lib.removePrincipal(player.source, ('%s:%s'):format(self.principal, grade))
    local playerGroups = player.get('groups')
    playerGroups[self.name] = nil
    GlobalState[('%s:count'):format(self.name)] -= 1
end

local db = require 'vehicle.db'

---Sets a players grade in a group and updates their permissions.
---@param player CPlayer
---@param grade number?
---@return boolean?
function CGroup:set(player, grade)
    if not grade then grade = 0 end

    if not self.grades[grade] and grade > 0 then
        error(("Attempted to set group '%s' to invalid grade '%s for player.%s"):format(self.name, grade, player.source))
    end

    local currentGrade = player.get('groups')[self.name]

    if currentGrade then
        self:remove(player, currentGrade)
    end

    if grade < 1 then
        if not currentGrade then return end
        grade = nil
        db.removeCharacterGroup(player.charid, self.name)
    else
        db.updateCharacterGroup(player.charid, self.name, grade)
        self:add(player, grade)
    end

    TriggerEvent('ox:setGroup', player.source, self.name, grade)
    TriggerClientEvent('ox:setGroup', player.source, self.name, grade)

    return true
end
