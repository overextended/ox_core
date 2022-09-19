local CVehicle = {}

local vehicleExports = {}
setmetatable(vehicleExports, {
    __index = function(_, index)
        vehicleExports = Ox.GetVehicleExports()
        return vehicleExports[index]
    end
})

local exp = exports.ox_core

function CVehicle:__index(index)
    local method = CVehicle[index]

    if method then
        return function(...)
            return method(self, ...)
        end
    end

    local export = vehicleExports[index]

    if export then
        return function(...)
            return exp:CVehicle(self.entity, index, ...)
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
    vehicle = type(vehicle) == 'table' and vehicle.entity or exp:GetVehicle(vehicle)
    return vehicle and setmetatable(vehicle, CVehicle)
end

function Ox.GetVehicleFromNetId(vehicle)
    vehicle = exp:GetVehicleFromNetId(vehicle)
    return vehicle and setmetatable(vehicle, CVehicle)
end

function Ox.CreateVehicle(data, coords, heading)
    local vehicle = exp:CreateVehicle(data, coords, heading)
    return type(vehicle) == 'table' and setmetatable(vehicle, CVehicle) or vehicle
end

function Ox.GetVehicles(usemetatable)
    local vehicles = exp:GetVehicles()

    if usemetatable then
        for i = 1, #vehicles do
            setmetatable(vehicles[i], CVehicle)
        end
    end

    return vehicles
end
