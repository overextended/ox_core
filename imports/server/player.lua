local CPlayer = {}

local playerExports = {}
setmetatable(playerExports, {
    __index = function(_, index)
        playerExports = Ox.GetPlayerExports()
        return playerExports[index]
    end
})

local exp = exports.ox_core

function CPlayer:__index(index)
    local method = CPlayer[index]

    if method then
        return function(...)
            return method(self, ...)
        end
    end

    local export = playerExports[index]

    if export then
        return function(...)
            return exp:CPlayer(self.source, index, ...)
        end
    end
end

function CPlayer:getState()
    return Player(self.source).state
end

function CPlayer:getCoords()
    return GetEntityCoords(self.ped)
end

function Ox.GetPlayer(playerId)
    local player = exp:GetPlayer(playerId)
    return player and setmetatable(player, CPlayer)
end

function Ox.GetPlayerByFilter(filter)
    local player = exp:GetPlayerByFilter(filter)
    return player and setmetatable(player, CPlayer)
end

function Ox.GetPlayers(usemetatable, filter)
    local players = exp:GetPlayers(filter)

    if usemetatable ~= false then
        for i = 1, #players do
            setmetatable(players[i], CPlayer)
        end
    end

    return players
end
