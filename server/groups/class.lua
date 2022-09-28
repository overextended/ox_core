---@class CGroup
---@field name string
---@field label string
---@field grades number[]
---@field principal string
---@field add fun(player: CPlayer, grade: number?)
---@field remove fun(player: CPlayer, grade: number?)
---@field set fun(player: CPlayer, grade: number?)

---@type CGroup
local CGroup = Class.new()

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

local db = require 'groups.db'
local pefcl = GetExport('pefcl')

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
    local maxGrade = #self.grades

    if pefcl and not exports.pefcl:getUniqueAccount(player.source, self.name).data then
        pefcl:createUniqueAccount(player.source, {
            name = self.label,
            type = 'shared',
            identifier = self.name
        })
    end

    if currentGrade then
        if currentGrade == grade then return end

        if pefcl and currentGrade >= maxGrade - 1 then
            pefcl:removeUserFromUniqueAccount(player.source, {
                userIdentifier = player.charid,
                accountIdentifier = self.name
            })

            Wait(100) -- race condition?
        end

        self.remove(player, currentGrade)
    end

    if grade < 1 then
        if not currentGrade then return end
        grade = nil
        db.removeCharacterGroup(player.charid, self.name)
    else
        if currentGrade then
            db.updateCharacterGroup(player.charid, self.name, grade)
        else
            db.addCharacterGroup(player.charid, self.name, grade)
        end

        if pefcl and grade >= (maxGrade - 1) then
            pefcl:addUserToUniqueAccount(player.source, {
                role = grade == maxGrade and 'admin' or 'contributor',
                accountIdentifier = self.name,
                userIdentifier = player.charid,
                source = player.source,
            })
        end

        self.add(player, grade)
    end

    TriggerEvent('ox:setGroup', player.source, self.name, grade)
    TriggerClientEvent('ox:setGroup', player.source, self.name, grade)

    return true
end

return CGroup
