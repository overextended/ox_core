local utils = {}

---@param event string
---@param fn function
function utils.registerNetEvent(event, fn)
    RegisterNetEvent(event, function(...)
        if source ~= '' then fn(...) end
    end)
end

---@param bagName string
---@param keyName string
---@return integer?
function utils.getEntityFromStateBagName(bagName, keyName)
    local netId = tonumber(bagName:gsub('entity:', ''), 10)

    lib.waitFor(function()
        if NetworkDoesEntityExistWithNetworkId(netId) then return true end
    end, ('%s received invalid entity! (%s)'):format(keyName, bagName), 10000)

    return NetworkGetEntityFromNetworkId(netId)
end

---@generic T
---@param keyFilter T
---@param cb fun(keyName: T, entity: number, value: any, bagName: string)
---@param requireValue? boolean Require a value to run the state handler.
---@param setAsNil? boolean Set the statebag to nil once it has completed.
---@return number
function utils.entityStateHandler(keyFilter, cb, requireValue, setAsNil)
    return AddStateBagChangeHandler(keyFilter, '', function(bagName, keyName, value, reserved, replicated)
        if requireValue and not value then return end

        local entity = utils.getEntityFromStateBagName(bagName, keyName)

        if entity == 0 then
            return error(('%s received invalid entity! (%s)'):format(keyName, bagName))
        end

        if entity then
            cb(keyName, entity, value, bagName)

            if setAsNil then
                Wait(0)
                Entity(entity).state:set(keyName, nil, true)
            end
        end
    end)
end

return utils
