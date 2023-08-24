local OxPlayer = {}

local playerExports = {}
setmetatable(playerExports, {
    __index = function(_, index)
        playerExports = Ox.GetPlayerExports()
        return playerExports[index]
    end
})

local exp = exports.ox_core

function OxPlayer:__index(index)
    local method = OxPlayer[index]

    if method then
        return function(...)
            return method(self, ...)
        end
    end

    local export = playerExports[index]

    if export then
        return function(...)
            return exp:CallPlayerMethod(self.source, index, ...)
        end
    end
end

function OxPlayer:getState()
    return Player(self.source).state
end

function OxPlayer:getCoords()
    return GetEntityCoords(self.ped)
end

function Ox.GetPlayer(playerId)
    local player = exp:GetPlayer(playerId)
    return player and setmetatable(player, OxPlayer)
end

function Ox.GetPlayerByFilter(filter)
    local player = exp:GetPlayerByFilter(filter)
    return player and setmetatable(player, OxPlayer)
end

function Ox.GetPlayers(filter)
    local players = exp:GetPlayers(filter)

    for i = 1, #players do
        setmetatable(players[i], OxPlayer)
    end

    return players
end
