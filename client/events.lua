local utils = require 'client.utils'

utils.entityStateHandler('initVehicle', function(entity)
    -- workaround for server-vehicles that exist in traffic randomly creating peds
    -- https://forum.cfx.re/t/sometimes-an-npc-spawns-inside-an-vehicle-spawned-with-createvehicleserversetter-or-create-automobile/4947251
    for i = -1, 0 do
        local ped = GetPedInVehicleSeat(entity, i)

        if ped ~= cache.ped and ped > 0 and NetworkGetEntityOwner(ped) == cache.playerId then
            DeleteEntity(ped)
        end
    end

    if not utils.waitFor(function() return IsEntityWaitingForWorldCollision(entity) end) then return end

    if NetworkGetEntityOwner(entity) ~= cache.playerId then return end

    SetVehicleOnGroundProperly(entity)
    Entity(entity).state:set('initVehicle', nil, true)
end)

utils.entityStateHandler('vehicleProperties', function(entity, _, value)
    if not value or NetworkGetEntityOwner(entity) ~= cache.playerId then return end

    lib.setVehicleProperties(entity, value)
    Entity(entity).state:set('vehicleProperties', nil, true)
end)

utils.entityStateHandler('lockStatus', function(entity, _, value)
    if not value or NetworkGetEntityOwner(entity) ~= cache.playerId then return end

    SetVehicleDoorsLocked(entity, value)
    Entity(entity).state:set('lockStatus', nil, true)
end)

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
