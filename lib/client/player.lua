local playerData = GetResourceState('ox_core') == 'started' and exports.ox_core:GetPlayerData() or {}
local player = {}
local playerEvents = {}
local groups = {}

setmetatable(playerData, player)

function player:__index(index)
    local value = player[index]

    if value ~= nil then return value end
    if not player.charId then return end

    if not playerEvents[index] then
        print(('make event ox:player:%s'):format(index))
        AddEventHandler(('ox:player:%s'):format(index), function(data)
            if GetInvokingResource() == 'ox_core' and source == '' then
                print(('triggered ox:player:%s'):format(index))
                self[index] = data
            end
        end)

        playerEvents[index] = true
    end

    value = exports.ox_core:GetPlayerData(index)
    self[index] = value

    return value
end

function player:__tostring()
    return string.format('{\n  "userId": %s\n  "charId": %s\n}',
        self.userId, self.charId)
end

for k, v in pairs(player) do
    if type(v) == 'function' and not k:match('^__') then
        player[k] = function(...)
            return v(playerData, ...)
        end
    end
end

function Ox.Player()
    return playerData
end

AddEventHandler('ox:playerLoaded', function(data)
    if playerData.charId then return end

    for k, v in pairs(data) do
        playerData[k] = v
    end
end)

AddEventHandler('ox:playerLogout', function()
    table.wipe(playerData)
end)

RegisterNetEvent('ox:setGroup', function(name, grade)
    if source == '' then return end

    groups[name] = grade
end)
