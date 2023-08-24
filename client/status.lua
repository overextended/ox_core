local statuses = {}

---@type table<string, number>
local currentStatus = {}

---@param name string
---@return number
function OxPlayer:getStatus(name)
    return currentStatus[name]
end

---@param name string
---@param value number
---@return true?
function OxPlayer:setStatus(name, value)
    if currentStatus[name] then
        currentStatus[name] = value
        return true
    end
end

---@param name string
---@param value number
---@return true?
function OxPlayer:addStatus(name, value)
    if currentStatus[name] then
        currentStatus[name] += value
        return true
    end
end

---@param name string
---@param value number
---@return true?
function OxPlayer:removeStatus(name, value)
    if currentStatus[name] then
        currentStatus[name] -= value
        return true
    end
end

local utils = require 'client.utils'

utils.registerNetEvent('ox:setPlayerStatus', function(name, value)
    statuses[name] = GlobalState[('status.%s'):format(name)]
    currentStatus[name] = value
end)

---@param name string
---@return number | table<string, number>
lib.callback.register('ox:getStatus', function(name)
    if name then
        return currentStatus[name]
    end

    return currentStatus
end)

---@param name string
---@param value number
---@param remove boolean
---@return number?
lib.callback.register('ox:updateStatus', function(name, value, remove)
    local current = currentStatus[name]

    if current then
        value = (remove and current - value) or current + value
        currentStatus[name] = math.floor(value * 1000 + 0.5) / 1000

        return currentStatus[name]
    end
end)

local function startStatusLoop()
    local i = 0

    while PlayerIsLoaded do
        i += 1

        for name, value in pairs(currentStatus) do
            local tickAmount = statuses[name].onTick

            if tickAmount then
                value += tickAmount
                currentStatus[name] = value < 0 and 0 or value > 100 and 100 or math.floor(value * 1000 + 0.5) / 1000
            end
        end

        if i == 60 then
            i = 0
            TriggerServerEvent('ox:updateStatuses', currentStatus)
        end

        TriggerEvent('ox:statusTick', currentStatus)

        Wait(1000)
    end
end

return startStatusLoop
