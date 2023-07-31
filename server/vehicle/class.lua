---@class PrivateVehicleProperties
---@field metadata table<string, any>

---@class OxVehicleInternal : OxVehicleProperties
---@field private private PrivateVehicleProperties
local OxVehicle = {}

---@type table<string, true>
local vehicleExports = {}

setmetatable(OxVehicle, {
    __newindex = function(self, key, value)
        rawset(self, key, value)
        vehicleExports[key] = true
    end
})

function Ox.GetVehicleExports()
    return vehicleExports
end

---Backing method for imported method calls.
---@param source number
---@param method string
---@param ... unknown?
---@return unknown?
function Ox.CallVehicleMethod(source, method, ...)
    local vehicle = Ox.GetVehicle(source)

    if vehicle then
        return OxVehicle[method](vehicle, ...)
    end
end

---Gets the vehicle's metadata, returning the entire table if key is omitted.
---@param index any
---@return any
function OxVehicle:get(index)
    local data = self.private.metadata

    if not index then return data end

    return data[index]
end

---Update the vehicle's metadata.
---@param key string
---@param value any
function OxVehicle:set(key, value)
    self.private.metadata[key] = value
end

---@return StateBag
function OxVehicle:getState()
    return Entity(self.entity).state
end

local registry

---@todo resolve circular dependency
CreateThread(function()
    registry = require 'server.vehicle.registry'
end)

function OxVehicle:despawn()
    registry.remove(self, false)
end

function OxVehicle:delete()
    registry.remove(self, true)
end

local db = require 'server.vehicle.db'

---@param value string
---@param despawn? boolean
function OxVehicle:setStored(value, despawn)
    db.setStored(value, self.id)
    self.stored = value

    if despawn then
        self:despawn()
    end
end

---@param newOwner? number
function OxVehicle:setOwner(newOwner)
    db.setOwner(newOwner, self.id)
    self.owner = newOwner
    self:getState():set('owner', newOwner, true)
end

---@param newGroup? string
function OxVehicle:setGroup(newGroup)
    db.setGroup(newGroup, self.id)
    self.group = newGroup
end

---May mismatch with properties due to "fake plates". Used to prevent duplicate "persistent plates".
---@param plate string
function OxVehicle:setPlate(plate)
    self.plate = ('%-8s'):format(plate)
    db.setPlate({ self.plate, self.id })
end

local Class = require 'shared.class'
return Class.new(OxVehicle)
