local OxVehicle = {}

local vehicleExports = {}
setmetatable(vehicleExports, {
    __index = function(_, index)
        vehicleExports = Ox.GetVehicleExports()
        return vehicleExports[index]
    end
})

local exp = exports.ox_core

function OxVehicle:__index(index)
    local method = OxVehicle[index]

    if method then
        return function(...)
            return method(self, ...)
        end
    end

    local export = vehicleExports[index]

    if export then
        return function(...)
            return exp:CallVehicleMethod(self.entity, index, ...)
        end
    end
end

function OxVehicle:getState()
    return Entity(self.entity).state
end

function OxVehicle:getCoords()
    return GetEntityCoords(self.entity)
end

function Ox.GetVehicle(vehicle)
    vehicle = type(vehicle) == 'table' and vehicle.entity or exp:GetVehicle(vehicle)
    return vehicle and setmetatable(vehicle, OxVehicle)
end

function Ox.GetVehicleFromNetId(vehicle)
    vehicle = exp:GetVehicleFromNetId(vehicle)
    return vehicle and setmetatable(vehicle, OxVehicle)
end

function Ox.GetVehicleFromVehicleId(vehicle)
    vehicle = exp:GetVehicleFromVehicleId(vehicle)
    return vehicle and setmetatable(vehicle, OxVehicle)
end

function Ox.CreateVehicle(data, coords, heading)
    local vehicle = exp:CreateVehicle(data, coords, heading)
    return type(vehicle) == 'table' and setmetatable(vehicle, OxVehicle) or vehicle
end

function Ox.GetVehicles()
    local vehicles = exp:GetVehicles()

    for i = 1, #vehicles do
        setmetatable(vehicles[i], OxVehicle)
    end

    return vehicles
end
