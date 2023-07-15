---@class OxPlayerProperties
---@field ped number
---@field source number
---@field userid number
---@field charid number
---@field characters? table
---@field private table

local db = require 'server.player.db'

---@class OxPlayer : OxPlayerProperties
local OxPlayer = {}

---@type table<string, true>
local playerExports = {}

setmetatable(OxPlayer, {
    __newindex = function(self, key, value)
        rawset(self, key, value)
        playerExports[key] = true
    end
})

function Ox.GetPlayerExports()
    return playerExports
end

---Backing method for imported method calls.
---@param source number
---@param method string
---@param ... unknown?
---@return unknown?
function Ox.CallPlayerMethod(source, method, ...)
    local player = Ox.GetPlayer(source)

    if player then
        return OxPlayer[method](player, ...)
    end
end

---Update the player's metadata, optionally syncing it with the client.
---@param key string
---@param value any
---@param replicated boolean?
function OxPlayer:set(key, value, replicated)
    local _key, count = key:gsub('%W', '')

    if count > 0 then
        print(("^3Received invalid key '%s' for player.set(); can only contain alphanumeric values.\nKey was changed to '%s'.^0"):format(key, _key))
        key = _key
    end

    self.private.metadata[key] = value

    if replicated then
        TriggerClientEvent('ox:setPlayerData', self.source, key, value)
    end
end

---Gets the player's metadata, returning the entire table if key is omitted.
---@param key string
---@return any
function OxPlayer:get(key)
    local metadata = self.private.metadata

    if not key then return metadata end

    local _key, count = key:gsub('%W', '')

    if count > 0 then
        print(("^3Received invalid key '%s' for player.get(); can only contain alphanumeric values.\nKey was changed to '%s'.^0"):format(key, _key))
        key = _key
    end

    return metadata[key]
end

---Sets the player's grade for the given group.
---@param name string
---@param grade number?
function OxPlayer:setGroup(name, grade)
    Ox.GetGroup(name):set(self, grade)
end

---Gets the player's grade for the given group.
---@param name string
---@return number?
function OxPlayer:getGroup(name)
    return self.private.groups[name]
end

---Gets all groups the player is in.
---@return table<string, number>
function OxPlayer:getGroups()
    return self.private.groups
end

---Checks if the player has any groups matching the filter, returning the first match.
---The filter be the group, an array of groups, or a map where key is the group and value is the minimum grade.
---@param filter string | string[] | table<string, number>
---@return string? group, number? grade
function OxPlayer:hasGroup(filter)
    local type = type(filter)
    local groups = self.private.groups

    if type == 'string' then
        local grade = groups[filter]

        if grade then
            return filter, grade
        end
    elseif type == 'table' then
        local tabletype = table.type(filter)

        if tabletype == 'hash' then
            for name, grade in pairs(filter) do
                local playerGrade = groups[name]

                if playerGrade and grade <= playerGrade then
                    return name--[[@as string]] , playerGrade --[[@as number]]
                end
            end
        elseif tabletype == 'array' then
            for i = 1, #filter do
                local name = filter[i]
                local grade = groups[name]

                if grade then
                    return name, grade --[[@as number]]
                end
            end
        end
    end
end

---@param name string
---@param value number
---@return true?
function OxPlayer:setStatus(name, value)
    self.private.statuses[name] = value
    TriggerClientEvent('ox:setPlayerStatus', self.source, name, value)

    return true
end

---@param name string
---@param value number
---@return true?
function OxPlayer:addStatus(name, value)
    if self.private.statuses[name] then
        self.private.statuses[name] = lib.callback.await('ox:updateStatus', self.source, name, value)

        return true
    end
end

---@param name string
---@param value number
---@return true?
function OxPlayer:removeStatus(name, value)
    if self.private.statuses[name] then
        self.private.statuses[name] = lib.callback.await('ox:updateStatus', self.source, name, value, true)

        return true
    end
end

---@return table<string, { issued: string }>
function OxPlayer:getLicenses()
    return self.private.licenses
end

---@param name string
---@return { issued: string }
function OxPlayer:getLicense(name)
    return self.private.licenses[name]
end

---@param name string
---@return true?
function OxPlayer:addLicense(name)
    local issued = os.date('%Y-%m-%d') --[[@as string]]

    db.addCharacterLicense(self.charid, name, issued)

    self.private.licenses[name] = {
        issued = issued
    }

    TriggerEvent('ox:licenseAdded', self.source, name)
    TriggerClientEvent('ox:licenseAdded', self.source, name)

    return true
end

---@param name string
---@return true?
function OxPlayer:removeLicense(name)
    db.removeCharacterLicense(self.charid, name)

    self.private.licenses[name] = nil

    TriggerEvent('ox:licenseRemoved', self.source, name)
    TriggerClientEvent('ox:licenseRemoved', self.source, name)

    return true
end

---Gets all player ids in scope of the player.
---@return table<number, true>
function OxPlayer:getPlayersInScope()
    return self.private.inScope
end

---Check if the target playerId is in range of the player.
---@param target number
---@return boolean
function OxPlayer:isPlayerInScope(target)
    return self.private.inScope[target]
end

---Trigger a client event for all players in range of the player.
---@param eventName string
---@param ... any
function OxPlayer:triggerScopedEvent(eventName, ...)
    local inScope = self.private.inScope

    for id in pairs(inScope) do
        TriggerClientEvent(eventName, id, ...)
    end
end

local npwd = GetExport('npwd')
local pefcl = GetExport('pefcl')

---@param dropped boolean?
function OxPlayer:logout(dropped)
    if not self.charid then return end

    TriggerEvent('ox:playerLogout', self.source, self.userid, self.charid)
    self:save()

    self.charid = nil

    for name, grade in pairs(self.private.groups) do
        local group = Ox.GetGroup(name)

        if group then
            group:remove(self, grade)
        end
    end

    if not dropped then
        if npwd then
            npwd:unloadPlayer(self.source)
        end

        if pefcl then
            pefcl:unloadPlayer(self.source)
        end

        self.characters = self:selectCharacters()

        table.wipe(self.private.statuses)
        table.wipe(self.private.licenses)
        table.wipe(self.private.metadata)

        TriggerClientEvent('ox:selectCharacter', self.source, self.characters)
    end
end

---Private methods (available inside ox_core)
---@todo Separate class into multiple files (common code, internal code)

setmetatable(OxPlayer, nil)

---@return StateBag
function OxPlayer:getState()
    return Player(self.source).state
end

function OxPlayer:setAsJoined(playerId)
    self.source = playerId
    self:getState():set('userid', self.userid, true)
end

local appearance = GetExport('ox_appearance')

---Fetch all characters owned by the player from the database.
---@return table
function OxPlayer:selectCharacters()
    local characters = db.selectCharacters(self.userid)

    for i = 1, #characters do
        local character = characters[i]
        character.appearance = appearance:load(self.source, character.charid)
    end

    return characters
end

---Prepare character data to save to the database.
---@return table
function OxPlayer:prepareSaveData(date)
    local playerPed = self.ped
    local coords = GetEntityCoords(playerPed)

    return {
        coords.x,
        coords.y,
        coords.z,
        GetEntityHeading(playerPed),
        self:get('isDead') or false,
        date,
        GetEntityHealth(playerPed),
        GetPedArmour(playerPed),
        json.encode(self.private.statuses),
        self.charid
    }
end

---Update the database with a player's current data.
function OxPlayer:save()
    if self.charid then
        db.updateCharacter(self:prepareSaveData(os.date('%Y-%m-%d')))
    end
end

local Class = require 'shared.class'
return Class.new(OxPlayer)
