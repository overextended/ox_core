local utils = {}

---@param event string
---@param fn function
function utils.registerNetEvent(event, fn)
    RegisterNetEvent(event, function(...)
        if source ~= '' then fn(...) end
    end)
end

---@async
function utils.waitFor(cb, timeout)
    local hasValue = cb()
    local i = 0

    while not hasValue do
        if timeout then
            i += 1

            if i > timeout then return end
        end

        Wait(0)
        hasValue = cb()
    end

    return hasValue
end

---@async
---@param bagName string
---@return integer?, integer
function utils.getEntityAndNetIdFromBagName(bagName)
    local netId = tonumber(bagName:gsub('entity:', ''), 10)

    if not utils.waitFor(function()
        return NetworkDoesEntityExistWithNetworkId(netId)
    end, 10000) then
        return print(('statebag timed out while awaiting entity creation! (%s)'):format(bagName)), 0
    end

    local entity = NetworkGetEntityFromNetworkId(netId)

    if entity == 0 then
        return print(('statebag received invalid entity! (%s)'):format(bagName)), 0
    end

    return entity, netId
end

---@param keyFilter string
---@param cb fun(entity: number, netId: number, value: any, bagName: string)
---@return number
function utils.entityStateHandler(keyFilter, cb)
    return AddStateBagChangeHandler(keyFilter, '', function(bagName, key, value, reserved, replicated)
        local entity, netId = utils.getEntityAndNetIdFromBagName(bagName)

        if entity then
            cb(entity, netId, value, bagName)
        end
    end)
end

return utils
