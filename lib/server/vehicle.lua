---@diagnostic disable: redundant-parameter
---@class OxVehicleServer : OxClass
local OxVehicle = lib.class('OxVehicle')

function OxVehicle:__index(index)
    local value = OxVehicle[index] --[[@as any]]

    if type(value) == 'function' then
        self[index] = value == OxVehicle.__call and function(...)
            return value(self, index, ...)
        end or function(...)
            return value(self, ...)
        end

        return self[index]
    end

    return value
end

function OxVehicle:constructor(data)
    for k, v in pairs(data) do
        self[k] = v
    end
end

function OxVehicle:__call(...)
    return exports.ox_core:CallVehicle(self.vin, ...)
end

function OxVehicle:__tostring()
    return json.encode(self, { indent = true})
end

function OxVehicle:getCoords()
    return GetEntityCoords(self.entity);
end

function OxVehicle:getState()
    return Entity(self.entity).state;
end

for method in pairs(exports.ox_core:GetVehicleCalls() or {}) do
    if not rawget(OxVehicle, method) then OxVehicle[method] = OxVehicle.__call end
end

local function CreateVehicleInstance(vehicle)
    if not vehicle then return end;

    return OxVehicle:new(vehicle)
end

---@class OxServer
local Ox = Ox

function Ox.GetVehicle(handle)
    return type(handle) == 'string' and Ox.GetVehicleFromVin(handle) or Ox.GetVehicleFromEntity(handle)
end

function Ox.GetVehicleFromEntity(entityId)
    return CreateVehicleInstance(exports.ox_core:GetVehicleFromEntity(entityId))
end

function Ox.GetVehicleFromNetId(netId)
    return CreateVehicleInstance(exports.ox_core:GetVehicleFromNetId(netId))
end

function Ox.GetVehicleFromVin(vin)
    return CreateVehicleInstance(exports.ox_core:GetVehicleFromVin(vin))
end

function Ox.GetVehicles(filter)
    local vehicles = exports.ox_core:GetVehicles(filter)

    for i = 1, #vehicles do
        vehicles[i] = CreateVehicleInstance(vehicles[i])
    end

    return vehicles
end

function Ox.GetVehicleFromFilter(filter)
    return CreateVehicleInstance(exports.ox_core:GetVehicleFromFilter(filter))
end

function Ox.CreateVehicle(data, coords, heading)
    return CreateVehicleInstance(exports.ox_core:CreateVehicle(data, coords, heading));
end

function Ox.SpawnVehicle(dbId, coords, heading)
    return CreateVehicleInstance(exports.ox_core:SpawnVehicle(dbId, coords, heading));
end
