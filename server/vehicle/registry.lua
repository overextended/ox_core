---@type { [number]: CVehicle }
local VehicleRegistry = {}

---Returns an instance of CVehicle for the given entityId.
---@param entityId number
---@return table
function Ox.GetVehicle(entityId)
    return VehicleRegistry[entityId]
end

---Return vehicle data for the given network id.
---@param netId number
---@return table
function Ox.GetVehicleFromNetId(netId)
    return Ox.GetVehicle(NetworkGetEntityFromNetworkId(netId))
end

---Return all vehicle data.
---@return table
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
