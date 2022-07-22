player = {}
local CPlayer = {}
CPlayer.__index = CPlayer
local data = {}

function SetPlayerData(data)
    data.loaded = true
    player = setmetatable(data, CPlayer)
end

NetEventHandler('ox:setGroup', function(name, grade)
    player.groups[name] = grade
end)

NetEventHandler('ox:setPlayerData', function(index, value)
    data[index] = value
end)

function CPlayer:get(index)
    return data[index]
end

---API entry point for triggering player methods.
---@param method string
---@param ... unknown
---@return unknown
function Ox.CPlayer(method, ...)
    method = CPlayer[method]
    return method and method(player, ...)
end

function Ox.GetPlayerData()
    return player.loaded and player
end

function Ox.PlayerExports()
    return {
        get = true
    }
end
