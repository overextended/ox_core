---@diagnostic disable: redundant-parameter
---@class OxPlayerServer : OxClass
local OxPlayer = lib.class('OxPlayer')

function OxPlayer:__index(index)
    local value = OxPlayer[index] --[[@as any]]

    if type(value) == 'function' then
        self[index] = value == OxPlayer.__call and function(...)
            return value(self, index, ...)
        end or function(...)
            return value(self, ...)
        end

        return self[index]
    end

    return value
end

function OxPlayer:constructor(data)
    for k, v in pairs(data) do
        self[k] = v
    end
end

function OxPlayer:__call(...)
    return exports.ox_core:CallPlayer(self.source, ...)
end

function OxPlayer:__tostring()
    return string.format('{\n  "source": %s\n  "userId": %s\n  "identifier": %s\n  "username": %s\n}', self.source,
        self.userId, self.identifier, self.username)
end

function OxPlayer:getCoords()
    return GetEntityCoords(self.ped);
end

function OxPlayer:getState()
    return Player(self.source).state;
end

function OxPlayer:getGroup(filter)
    local result = OxPlayer.__call(self, 'getGroup', filter)

    if type(result) == 'table' then
        return table.unpack(result)
    end

    return result
end

function OxPlayer:getAccount()
    return self.charId and Ox.GetCharacterAccount(self.charId) or nil
end

function OxPlayer:getGroupByType(type)
    local result = OxPlayer.__call(self, 'getGroupByType', type)

    if result then
        return table.unpack(result)
    end
end

for method in pairs(exports.ox_core:GetPlayerCalls() or {}) do
    if not rawget(OxPlayer, method) then OxPlayer[method] = OxPlayer.__call end
end

local function CreatePlayerInstance(player)
    if not player then return end;

    return OxPlayer:new(player)
end

---@class OxServer
local Ox = Ox

function Ox.GetPlayer(playerId)
    return CreatePlayerInstance(exports.ox_core:GetPlayer(playerId))
end

function Ox.GetPlayerFromUserId(userId)
    return CreatePlayerInstance(exports.ox_core:GetPlayerFromUserId(userId))
end

function Ox.GetPlayerFromCharId(charId)
    return CreatePlayerInstance(exports.ox_core:GetPlayerFromCharId(charId))
end

function Ox.GetPlayers(filter)
    local players = exports.ox_core:GetPlayers(filter)

    for i = 1, #players do
        players[i] = CreatePlayerInstance(players[i])
    end

    return players
end

function Ox.GetPlayerFromFilter(filter)
    return CreatePlayerInstance(exports.ox_core:GetPlayerFromFilter(filter))
end
