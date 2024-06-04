---@diagnostic disable: redundant-parameter
---@class OxPlayerClient : OxClass
local OxPlayer = lib.class('OxPlayer')

-- Support for `player.method` rather than self (:) syntax
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

function OxPlayer:constructor(userId, charId, stateId)
    self.userId = userId
    self.charId = charId
    self.stateId = stateId
end

function OxPlayer:__call(...)
    return exports.ox_core:CallPlayer(...)
end

function OxPlayer:__tostring()
    return string.format('{\n  "userId": %s\n  "charId": %s\n  "stateId": %s\n}',
        self.userId, self.charId, self.stateId)
end

local getters = {}

function OxPlayer:get(key)
    if not self.charId then return end

    if not getters[key] then
        print(('make event ox:player:%s'):format(key))

        AddEventHandler(('ox:player:%s'):format(key), function(data)
            if GetInvokingResource() == 'ox_core' and source == '' then
                print(('triggered ox:player:%s'):format(key))
                self[key] = data
            end
        end)

        getters[key] = true
        self[key] = OxPlayer:__call('get', key);
    end

    return self[key]
end

function OxPlayer:getCoords()
    return GetEntityCoords(cache.ped);
end

function OxPlayer:getState()
    return LocalPlayer.state;
end

function OxPlayer:getGroup(filter)
    local result = OxPlayer:__call('getGroup', filter)

    if type(result) == 'table' then
        return table.unpack(result)
    end

    return result
end

function OxPlayer:getGroupByType(type)
    local result = OxPlayer:__call('getGroupByType', type)

    if result then
        return table.unpack(result)
    end
end

---@class OxClient
local Ox = Ox

local _, userId, charId, stateId = pcall(function()
    local data = exports.ox_core.GetPlayer()

    if data then return data.userId, data.charId, data.stateId end
end)

local player = OxPlayer:new(userId, charId, stateId)

function Ox.GetPlayer()
    return player
end

local function getMethods()
    for method in pairs(exports.ox_core:GetPlayerCalls()) do
        if not rawget(OxPlayer, method) then OxPlayer[method] = OxPlayer.__call end
    end
end

-- Prevent errors if resource starts before ox_core (generally during development)
if not pcall(getMethods) then CreateThread(getMethods) end

AddEventHandler('ox:playerLoaded', function(data)
    if player.charId then return end

    for k, v in pairs(data) do player[k] = v end
end)

AddEventHandler('ox:playerLogout', function()
    table.wipe(player)
end)
