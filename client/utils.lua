local utils = {}

---@param event string
---@param fn function
function utils.registerNetEvent(event, fn)
    RegisterNetEvent(event, function(...)
        if source ~= '' then fn(...) end
    end)
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
        Wait(100)

        local entity = 0
        for i = 1, 50 do
            Wait(1)
            entity = GetEntityFromStateBagName(bagName)
            if entity ~= 0 then break end
        end

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
