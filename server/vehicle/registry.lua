---@type table<number, OxVehicleInternal>
local VehicleRegistry = {}

---Returns an instance of OxVehicle for the given entityId.
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

return VehicleRegistry
