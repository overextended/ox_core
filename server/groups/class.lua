---@class OxGroup : OxGroupProperties
local OxGroup = {}
local pefcl = GetExport('pefcl')

---@param player OxPlayerInternal
---@param grade number
function OxGroup:add(player, grade)
    local playerGroups = player:getGroups()

    lib.addPrincipal(player.source, ('%s:%s'):format(self.principal, grade))

    playerGroups[self.name] = grade
    GlobalState[('%s:count'):format(self.name)] += 1

    if pefcl then
        self:setAccount(player, grade)
    end
end

---@param player OxPlayerInternal
---@param grade number
function OxGroup:remove(player, grade)
    local playerGroups = player:getGroups()

    lib.removePrincipal(player.source, ('%s:%s'):format(self.principal, grade))

    playerGroups[self.name] = nil
    GlobalState[('%s:count'):format(self.name)] -= 1

    if pefcl then
        self:setAccount(player, grade, true)
    end
end

---@param player OxPlayerInternal
---@param grade number
---@param remove? boolean
function OxGroup:setAccount(player, grade, remove)
    local maxGrade = #self.grades

    if remove then
        if player.charId and grade >= maxGrade - 1 and exports.pefcl:getUniqueAccount(player.source, self.name).data then
            pefcl:removeUserFromUniqueAccount(player.source, {
                userIdentifier = player.charId,
                accountIdentifier = self.name
            })
        end
    else
        if self.hasAccount and grade >= maxGrade - 1 then
            if not exports.pefcl:getUniqueAccount(player.source, self.name).data then
                pefcl:createUniqueAccount(player.source, {
                    name = self.label,
                    type = 'shared',
                    identifier = self.name
                })
            end

            pefcl:addUserToUniqueAccount(player.source, {
                role = grade >= self.adminGrade and 'admin' or 'contributor',
                accountIdentifier = self.name,
                userIdentifier = player.charId,
                source = player.source,
            })
        end
    end
end

local db = require 'server.groups.db'

---@param player OxPlayerInternal
---@param grade? number
function OxGroup:set(player, grade)
    if not grade then grade = 0 end

    if not self.grades[grade] and grade > 0 then
        error(("Attempted to set group '%s' to invalid grade '%s for player.%s"):format(self.name, grade, player.source))
    end

    local currentGrade = player:getGroup(self.name)

    if currentGrade then
        if currentGrade == grade then return end
        self:remove(player, currentGrade)
    end

    if grade < 1 then
        if not currentGrade then return end
        grade = nil
        db.removeCharacterGroup(player.charId, self.name)
    else
        if currentGrade then
            db.updateCharacterGroup(player.charId, self.name, grade)
        else
            db.addCharacterGroup(player.charId, self.name, grade)
        end

        self:add(player, grade)
    end

    TriggerEvent('ox:setGroup', player.source, self.name, grade)
    TriggerClientEvent('ox:setGroup', player.source, self.name, grade)

    return true
end

local Class = require 'shared.class'
return Class.new(OxGroup)
