---@type table<number, OxVehicleInternal>
local VehicleRegistry = {}

---@type table<number, number>
local entityIdFromVehicleId = {}
local db = require 'server.vehicle.db'
local OxVehicle = require 'server.vehicle.class'

---@param id? number
---@param owner? number | boolean
---@param group? string | boolean
---@param plate string
---@param model string
---@param script string
---@param metadata table
---@param coords vector3
---@param heading number
---@param vType string
---@return OxVehicleInternal?
local function addVehicle(id, owner, group, plate, vin, model, script, metadata, coords, heading, vType)
    -- Change vehicle types to net types.
    -- https://github.com/citizenfx/fivem/commit/1e266a2ca5c04eb96c090de67508a3475d35d6da
    if vType == 'bicycle' then
        vType = 'bike'
    elseif vType == 'quadbike' or vType == 'amphibious_quadbike' or vType == 'amphibious_automobile' or vType == 'submarinecar' then
        vType = 'automobile'
    elseif vType == 'blimp' then
        vType = 'heli'
    end

    local entity = CreateVehicleServerSetter(joaat(model), vType, coords.x, coords.y, coords.z, heading)

    if not DoesEntityExist(entity) then
        return print(("^1Failed to spawn vehicle '%s'^0"):format(model))
    end

    local vehicle = OxVehicle.new({
        id = id,
        netid = NetworkGetNetworkIdFromEntity(entity),
        owner = owner,
        group = group,
        entity = entity,
        script = script,
        plate = plate,
        vin = vin,
        model = model,
        private = {
            metadata = metadata,
        },
    })

    local state = vehicle:getState()

    state:set('initVehicle', true, true)
    state:set('owner', vehicle.owner, true)
    state:set('vehicleProperties', metadata.properties)
    ---@todo Setup locks / keysystem?
    state:set('lockStatus', metadata.lockStatus or 1)

    VehicleRegistry[vehicle.entity] = vehicle

    if id then
        entityIdFromVehicleId[id] = entity
    end

    if owner ~= false or group then
        db.setStored(nil, vehicle.id)
    end

    TriggerEvent('ox:createdVehicle', vehicle.entity, vehicle.id)

    return vehicle
end

---Removes a vehicle from the vehicle registry and despawns the entity.
---Vehicle will be saved if removeFromDatabase is false.
---@param vehicle OxVehicleInternal
---@param removeFromDatabase boolean?
local function removeVehicle(vehicle, removeFromDatabase)
    local entity = vehicle.entity

    if vehicle.owner ~= false or vehicle.group then
        if removeFromDatabase then
            return db.deleteVehicle(vehicle.id)
        end

        db.updateVehicle({
            vehicle.stored,
            json.encode(vehicle:get()),
            vehicle.id
        })
    end

    VehicleRegistry[entity] = nil
    entityIdFromVehicleId[entity] = nil
    if DoesEntityExist(entity) then
        DeleteEntity(entity)
    end
end

---Loads a vehicle from the database by id, or creates a new vehicle using provided data.
---@param data table | number
---@param coords vector3
---@param heading? number
---@return table | number | nil
function Ox.CreateVehicle(data, coords, heading)
    local script = GetInvokingResource()

    if type(data) == 'number' then
        do
            local type = type(coords)

            if type == 'table' then
                if coords[1] then
                    coords = vector3(coords[1], coords[2], coords[3])
                end
            elseif type ~= 'vector3' then
                TypeError('coords', 'vector3', type)
            end
        end

        do
            local type = type(heading)

            if type ~= 'number' then
                TypeError('heading', 'number', type)
            end
        end

        local vehicle = db.getVehicleFromId(data)

        if not vehicle then
            error(("Failed to spawn vehicle with id '%s' (invalid id or already spawned)"):format(data))
        end

        vehicle.data = json.decode(vehicle.data) or {}
        local modelData = Ox.GetVehicleData(vehicle.model) --[[@as VehicleData]]

        if not modelData then
            error(("Vehicle model is invalid '%s'\nEnsure vehicle exists in '@ox_core/shared/files/vehicles.json'"):format(vehicle.model))
        end

        return addVehicle(data, vehicle.owner, vehicle.group, vehicle.plate, vehicle.vin, vehicle.model, script, vehicle.data, coords,
            heading or 90.0, modelData.type)
    end

    do
        local type = type(data.model)

        if type ~= 'string' then
            TypeError('data.model', 'string', type)
        end
    end

    local model = data.model:lower()
    local modelData = Ox.GetVehicleData(model) --[[@as VehicleData]]

    if not modelData then
        error(("Vehicle model is invalid '%s'\nEnsure vehicle exists in '@ox_core/shared/files/vehicles.json'"):format(model))
    end

    local owner = data.owner or false --[[@as boolean?]]
    local group = data.group or false --[[@as boolean?]]
    local stored = data.stored or not coords and 'impound' or nil
    local plate = Ox.GeneratePlate()
    local vin = Ox.GenerateVin(model)

    data = {
        properties = data.properties or {},
        lockStatus = data.lockStatus or 1,
    }

    data.properties.plate = plate

    if owner and owner < 1 then
        owner = nil
    end

    if group and type(group) ~= 'string' then
        group = nil
    end

    local vehicleId

    if owner ~= false or group then
        vehicleId = db.createVehicle(plate, vin, owner, group, model, modelData.class, data, stored)
    end

    if stored then
        return vehicleId
    end

    return addVehicle(vehicleId, owner, group, plate, vin, model, script, data, coords, heading or 90.0, modelData.type)
end

---Returns an instance of OxVehicleInternal for the given entityId.
---@param entityId number
---@return OxVehicleInternal
function Ox.GetVehicle(entityId)
    return VehicleRegistry[entityId]
end

---Return vehicle data for the given network id.
---@param netId number
---@return OxVehicleInternal
function Ox.GetVehicleFromNetId(netId)
    return VehicleRegistry[NetworkGetEntityFromNetworkId(netId)]
end

---Return vehicle data for the given persistent vehicle id (used in the database).
---@param vehicleId number
---@return OxVehicleInternal
function Ox.GetVehicleFromVehicleId(vehicleId)
    return VehicleRegistry[entityIdFromVehicleId[vehicleId]]
end

---@return table<number, OxVehicleInternal>
function Ox.GetVehicleRegistry()
    return VehicleRegistry
end

---Return data for all vehicles as an array.
---@return OxVehicleInternal[]
function Ox.GetVehicles()
    local size = 0
    local vehicles = {}

    for _, v in pairs(VehicleRegistry) do
        size += 1
        vehicles[size] = v
    end

    return vehicles
end

AddEventHandler('entityRemoved', function(entityId)
    local vehicle = VehicleRegistry[entityId]

    if not vehicle then return end

    if vehicle.id then
        if not vehicle.stored then
            vehicle:setStored('mors', true)
        end
    end

    vehicle:despawn()
end)

return {
    remove = removeVehicle,
}
