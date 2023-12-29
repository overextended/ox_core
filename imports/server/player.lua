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

function OxPlayer:getCoords(heading)
    local coords = GetEntityCoords(self.ped)
    if heading == true then
        coords = vector4(coords.x, coords.y, coords.z, GetEntityHeading(self.ped))
    end
    return coords
end

function OxPlayer:setCoords(coords)
    local coordsType = type(coords)
    if coordsType ~= "vector3" or coordsType ~= "vector4" then
        TypeError('coords', 'vector3', coordsType)
    end
    
    SetEntityCoords(self.ped, coords.x, coords.y, coords.z, false, false, false, false)
    if coordsType == "vector4" then
        SetEntityHeading(self.ped, coords.w)
    end
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
