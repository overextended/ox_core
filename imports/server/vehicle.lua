local ox_core = exports.ox_core
local CVehicle = {}
local VehicleExports = {}
setmetatable(VehicleExports, {
    __index = function(_, index)
        VehicleExports = Ox.VehicleExports()
        return VehicleExports[index]
    end
})

function CVehicle:__index(index)
    local method = CVehicle[index]

    if method then
        return function(...)
            return method(self, ...)
        end
    end

    local export = VehicleExports[index]

    if export then
        return function(...)
            return ox_core:CVehicle(self.entity, index, ...)
        end
    end
end

function CVehicle:getCoords(update)
    if update or not self.coords then
        self.coords = GetEntityCoords(self.entity)
    end

    return self.coords
end

function Ox.GetVehicle(vehicle)
    vehicle = type(vehicle) == 'table' and vehicle.entity or ox_core:GetVehicle(vehicle)
    return vehicle and setmetatable(vehicle, CVehicle)
end

function Ox.GetVehicleFromNetId(vehicle)
    vehicle = ox_core:GetVehicleFromNetId(vehicle)
    return vehicle and setmetatable(vehicle, CVehicle)
end

function Ox.CreateVehicle(data, coords, heading)
    local vehicle = ox_core:CreateVehicle(data, coords, heading)
    return type(vehicle) == 'table' and setmetatable(vehicle, CVehicle) or vehicle
end

function Ox.GetVehicles(usemetatable)
    local vehicles = ox_core:GetVehicles()

    if usemetatable then
        for i = 1, #vehicles do
            setmetatable(vehicles[i], CVehicle)
        end
    end

    return vehicles
end
