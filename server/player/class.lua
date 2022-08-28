---@class CPlayer
---@field ped number
---@field source number
---@field userid number
---@field charid number
---@field set fun(key: string, value: any, replicated: boolean)
---@field get fun(key: string): any
---@field getCoords fun(): vector3
---@field getState fun(): { [string]: any, set: fun(self: table, key: string, value: any, replicated: boolean) }
---@field setGroup fun(name: string, grade: number?)
---@field getGroup fun(name: string): number?
---@field hasGroup fun(filter: string | string[] | { [string]: number }): string?, number?
---@field isPlayerInScope fun(target: number): boolean
---@field triggerScopedEvent fun(event: string, ...: any)

---@type CPlayer
local CPlayer = {}
_ENV.CPlayer = CPlayer

---Used to lookup CPlayer when an index does not exist on a player, providing class methods.
---@param index string
---@return function?
function CPlayer:__index(index)
    local method = CPlayer[index]

    if method then
        return function(...)
            return method(self, ...)
        end
    end
end

---Backing method for imported method calls.
---@param source number
---@param method string
---@param ... unknown
---@return unknown
function Ox.CPlayer(source, method, ...)
    local player = Ox.GetPlayer(source)
    return player and CPlayer[method](player, ...)
end

local cfxPlayer = Player

function CPlayer:getState()
    return cfxPlayer(self.source).state
end

local playerData = {}

---Triggered after player instantiation to setup metadata.
---@param data table
function CPlayer:init(data)
    if not playerData[self.source] then
        PlayerRegistry[self.source] = self
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

---Gets the player's metadata, returning the entire table if key is omitted.
---@param key string
---@return unknown
function CPlayer:get(key)
    local data = playerData[self.source]
    return key and data[key] or data
end

---Sets the player's grade for the given group.
---@param name string
---@param grade number?
function CPlayer:setGroup(name, grade)
    Ox.GetGroup(name):set(self, grade)
end

---Gets the player's grade for the given group.
---@param name string
---@return number?
function CPlayer:getGroup(name)
    return self.groups[name]
end

---Checks if the player has any groups matching the filter, returning the first match.  
---The filter be the group, an array of groups, or a map where key is the group and value is the minimum grade.  
---@param filter string | string[] | { [string]: number }
---@return string? group, number? grade
function CPlayer:hasGroup(filter)
    local type = type(filter)

    if type == 'string' then
        local grade = self.groups[filter]

        if grade then
            return filter, grade
        end
    elseif type == 'table' then
        local tabletype = table.type(filter)

        if tabletype == 'hash' then
            for name, grade in pairs(filter) do
                local playerGrade = self.groups[name]

                if playerGrade and grade <= playerGrade then
                    return name --[[@as string]], playerGrade --[[@as number]]
                end
            end
        elseif tabletype == 'array' then
            for i = 1, #filter do
                local name = filter[i]
                local grade = self.groups[name]

                if grade then
                    return name, grade --[[@as number]]
                end
            end
        end
    else
        error(("received '%s' when checking player group"):format(filter))
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
    Player.save(self)
    TriggerEvent('ox:playerLogout', self.source, self.userid, self.charid)

    if dropped then
        playerData[self.source] = nil
        PlayerRegistry[self.source] = nil
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

local playerExports = {}

for k in pairs(CPlayer) do
    playerExports[k] = true
end

function Ox.GetPlayerExports()
    return playerExports
end
