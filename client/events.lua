local utils = require 'client.utils'

utils.entityStateHandler('initVehicle', function(key, entity, value)
    if not value then return end

    -- workaround for server-vehicles that exist in traffic randomly creating peds
    -- https://forum.cfx.re/t/sometimes-an-npc-spawns-inside-an-vehicle-spawned-with-createvehicleserversetter-or-create-automobile/4947251
    for i = -1, 0 do
        local ped = GetPedInVehicleSeat(entity, i)

        if ped ~= cache.ped and ped > 0 and NetworkGetEntityOwner(ped) == cache.playerId then
            DeleteEntity(ped)
        end
    end

    lib.waitFor(function()
        if not IsEntityWaitingForWorldCollision(entity) then return true end
    end)

    if NetworkGetEntityOwner(entity) ~= cache.playerId then return end

    SetVehicleOnGroundProperly(entity)
end, true, true)

utils.entityStateHandler('vehicleProperties', function(key, entity, value)
    if NetworkGetEntityOwner(entity) ~= cache.playerId then return end

    lib.setVehicleProperties(entity, value)
end)

utils.entityStateHandler('lockStatus', function(key, entity, value)
    if not value or NetworkGetEntityOwner(entity) ~= cache.playerId then return end

    SetVehicleDoorsLocked(entity, value)
end, true, true)

lib.callback.register('ox:getNearbyVehicles', function(radius)
    local nearbyEntities = {}
    local playerCoords = GetEntityCoords(cache.ped)
    local vehicles = GetGamePool('CVehicle')
    local size = 0

    for i = 1, #vehicles do
        local entity = vehicles[i]
        local entityCoords = GetEntityCoords(entity)

        if #(entityCoords - playerCoords) <= (radius or 2) and NetworkGetEntityIsNetworked(entity) then
            size += 1
            nearbyEntities[size] = VehToNet(entity)
        end
    end

    return nearbyEntities
end)
