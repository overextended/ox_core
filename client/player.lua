---@todo rewrite player class for parity with server
---still need to do modules as well

PlayerIsLoaded = false
PlayerIsDead = false
player = {}

CPlayer = {}
CPlayer.__index = CPlayer

local playerData = {}

function SetPlayerData(data)
    PlayerIsLoaded = true
    player = setmetatable(data, CPlayer)
end

AddEventHandler('ox:playerLogout', function()
    PlayerIsLoaded = false
    PlayerIsDead = false
    table.wipe(playerData)
end)

NetEventHandler('ox:setGroup', function(name, grade)
    player.groups[name] = grade
end)

NetEventHandler('ox:setPlayerData', function(index, value)
    playerData[index] = value
    TriggerEvent(('ox:player:%s'):format(index), value)
end)

function CPlayer:get(index)
    return playerData[index]
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
    return PlayerIsLoaded and player
end

---@todo this should be setup automatically like the server
function Ox.PlayerExports()
    return {
        get = true,
        getStatus = true,
        setStatus = true,
        addStatus = true,
        removeStatus = true,
    }
end
