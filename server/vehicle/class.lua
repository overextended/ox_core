---@class OxVehicleProperties
---@field id number
---@field owner? number
---@field group? string
---@field netid number
---@field entity number
---@field model string
---@field plate string
---@field vin string
---@field script string
---@field stored? string

---@class OxVehicle : OxVehicleProperties
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

local vehicleData = {}
local VehicleRegistry = require 'server.vehicle.registry'

---Triggered after vehicle instantiation to setup metadata.
---@param data table
function OxVehicle:init(data)
    if not vehicleData[self.entity] then
        VehicleRegistry[self.entity] = self
        vehicleData[self.entity] = data

        local state = self:getState()

        state:set('initVehicle', true, true)
        state:set('owner', self.owner, true)

        if data.properties then
            state:set('vehicleProperties', data.properties)
        end

        ---@todo Setup locks / keysystem?
        state:set('lockStatus', data.lockStatus or 1)

        TriggerEvent('ox:createdVehicle', self.entity, self.id)
    end
end

---Gets the vehicle's metadata, returning the entire table if key is omitted.
---@param index any
---@return any
function OxVehicle:get(index)
    local data = vehicleData[self.entity]
    return index and data[index] or data
end

---Update the vehicle's metadata.
---@param key string
---@param value any
function OxVehicle:set(key, value)
    vehicleData[self.entity][key] = value
end

---@return StateBag
function OxVehicle:getState()
    return Entity(self.entity).state
end

local db = require 'server.vehicle.db'

---Removes a vehicle from the vehicle registry and despawns the entity.
---removeEntry will remove the vehicle from the database, otherwise it will be saved instead.
---@param vehicle OxVehicle
---@param removeEntry boolean?
---@param metadata table
local function despawnVehicle(vehicle, removeEntry, metadata)
    local entity = vehicle.entity

    if vehicle.owner ~= false or vehicle.group then
        if removeEntry then
            db.deleteVehicle(vehicle.id)
        elseif metadata then
            db.updateVehicle({
                vehicle.stored,
                json.encode(metadata),
                vehicle.id
            })
        end
    end

    VehicleRegistry[entity] = nil
    vehicleData[entity] = nil
    DeleteEntity(entity)
end

function OxVehicle:despawn()
    despawnVehicle(self, nil, vehicleData[self.entity])
end

function OxVehicle:delete()
    despawnVehicle(self, true)
end

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
