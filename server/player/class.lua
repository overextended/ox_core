---@class CPlayer
---@field ped number
---@field source number
---@field userid number
---@field charid number
---@field characters? table
---@field init fun(data: table)
---@field set fun(key: string, value: any, replicated: boolean)
---@field setdb fun(key: string, value: any, replicated: boolean)
---@field get fun(key: string): any
---@field getCoords fun(): vector3
---@field getState fun(): { [string]: any, set: fun(self: table, key: string, value: any, replicated: boolean) }
---@field setGroup fun(name: string, grade: number?)
---@field getGroup fun(name: string): number?
---@field hasGroup fun(filter: string | string[] | { [string]: number }): string?, number?
---@field isPlayerInScope fun(target: number): boolean
---@field triggerScopedEvent fun(event: string, ...: any)

local db = require 'player.db'

---@type CPlayer
local CPlayer = Class.new()

---@type { [string]: true }
local playerExports = {}

setmetatable(CPlayer, {
    __newindex = function(self, key, value)
        rawset(self, key, value)
        playerExports[key] = true
    end
})

---@return { [string]: true }
function Ox.GetPlayerExports()
    return playerExports
end

---Backing method for imported method calls.
---@param source number
---@param method string
---@param ... unknown?
---@return unknown?
function Ox.CPlayer(source, method, ...)
    local player = Ox.GetPlayer(source)

    if player then
        return CPlayer[method](player, ...)
    end
end

function CPlayer:getState()
    return CfxPlayer(self.source).state
end

local playerData = {}

---Triggered after player instantiation to setup metadata.
---@param data table
function CPlayer:init(data)
    if not playerData[self.source] then
        data.inScope = {}
        playerData[self.source] = data
    end
end

---Update the player's metadata, optionally syncing it with the client.
---@param key string
---@param value any
---@param replicated boolean
function CPlayer:set(key, value, replicated)
    playerData[self.source][key] = value

    if replicated then
        TriggerClientEvent('ox:setPlayerData', self.source, key, value)
    end
end

---Update the player's metadata and store in the DB, optionally syncing it with the client.
---@param key string
---@param value string | number | table
---@param replicated boolean
function CPlayer:setdb(key, value, replicated)
    local vType = type(value)

    if value and vType ~= 'string' and vType ~= 'number' and vType ~= 'table' and vType ~= 'boolean' then
        TypeError(key, 'string | number | table', vType)
    end

    playerData[self.source][key] = value
    db.updateMetadata(('$.%s'):format(key), (vType == 'table' and json.encode(value)) or value, self.charid)

    if replicated then
        TriggerClientEvent('ox:setPlayerData', self.source, key, value)
    end
end

---Gets the player's metadata, returning the entire table if key is omitted.
---@param key string
---@return unknown
function CPlayer:get(key)
    local data = playerData[self.source]
    if not key then return data end
    return data[key]
end

---Sets the player's grade for the given group.
---@param name string
---@param grade number?
function CPlayer:setGroup(name, grade)
    Ox.GetGroup(name).set(self, grade)
end

---Gets the player's grade for the given group.
---@param name string
---@return number?
function CPlayer:getGroup(name)
    return self.get('groups')[name]
end

---Checks if the player has any groups matching the filter, returning the first match.
---The filter be the group, an array of groups, or a map where key is the group and value is the minimum grade.
---@param filter string | string[] | { [string]: number }
---@return string? group, number? grade
function CPlayer:hasGroup(filter)
    local type = type(filter)
    local groups = self.get('groups')

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

---Check if the target playerId is in range of the player.
---@param target number
---@return boolean
function CPlayer:isPlayerInScope(target)
    return self.get('inScope')[target]
end

---Trigger a client event for all players in range of the player.
---@param eventName string
---@param ... any
function CPlayer:triggerScopedEvent(eventName, ...)
    local inScope = self.get('inScope')

    for id in pairs(inScope) do
        TriggerClientEvent(eventName, id, ...)
    end
end

local npwd = GetExport('npwd')

---@param dropped boolean?
function CPlayer:logout(dropped)
    if not self.charid then return end

    TriggerEvent('ox:playerLogout', self.source, self.userid, self.charid)
    Player.save(self, dropped)

    if dropped then
        playerData[self.source] = nil
    else
        if npwd then
            npwd:unloadPlayer(self.source)
        end

        self.charid = nil
        self.characters = Player.selectCharacters(self.source, self.userid)
        local data = playerData[self.source]

        playerData[self.source] = {
            license = data.license,
            steam = data.steam,
            fivem = data.fivem,
            discord = data.discord,
        }

        TriggerClientEvent('ox:selectCharacter', self.source, self.characters)
    end
end

return CPlayer
