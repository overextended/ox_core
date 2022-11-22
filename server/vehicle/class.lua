---@class CVehicle
---@field id number
---@field owner? number
---@field group? string
---@field netid number
---@field entity number
---@field model string
---@field plate string
---@field script string
---@field stored? string

---@type CVehicle
local CVehicle = {}

---@type { [string]: true }
local vehicleExports = {}

setmetatable(CVehicle, {
    __newindex = function(self, key, value)
        rawset(self, key, value)
        vehicleExports[key] = true
    end
})

---@return { [string]: true }
function Ox.GetVehicleExports()
    return vehicleExports
end

---Backing method for imported method calls.
---@param source number
---@param method string
---@param ... unknown?
---@return unknown?
function Ox.CVehicle(source, method, ...)
    local vehicle = Ox.GetVehicle(source)

    if vehicle then
        return CVehicle[method](vehicle, ...)
    end
end

local vehicleData = {}
local VehicleRegistry = require 'vehicle.registry'

---Triggered after vehicle instantiation to setup metadata.
---@param data table
function CVehicle:init(data)
    if not vehicleData[self.entity] then
        VehicleRegistry[self.entity] = self
        vehicleData[self.entity] = data
    end
end

---Gets the vehicle's metadata, returning the entire table if key is omitted.
---@param index any
---@return any
function CVehicle:get(index)
    local data = vehicleData[self.entity]
    return index and data[index] or data
end

---Update the vehicle's metadata.
---@param key string
---@param value any
function CVehicle:set(key, value)
    if key == 'properties' and value.plate then
        self.plate = value.plate
    end

    vehicleData[self.entity][key] = value
end

---@return StateBag
function CVehicle:getState()
    return Entity(self.entity).state
end

local db = require 'vehicle.db'

---Removes a vehicle from the vehicle registry and despawns the entity.
---removeEntry will remove the vehicle from the database, otherwise it will be saved instead.
---@param vehicle CVehicle
---@param removeEntry boolean?
---@param metadata table
local function despawnVehicle(vehicle, removeEntry, metadata)
    local entity = vehicle.entity

    if vehicle.owner ~= false or vehicle.group then
        if removeEntry then
            db.deleteVehicle(vehicle.id)
        elseif metadata then
            db.updateVehicle({
                vehicle.plate,
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

function CVehicle:despawn()
    despawnVehicle(self, nil, vehicleData[self.entity])
end

function CVehicle:delete()
    despawnVehicle(self, true)
end

---@param value string
---@param despawn? boolean
function CVehicle:setStored(value, despawn)
    db.setStored(value, self.id)
    self.stored = value

    if despawn then
        self:despawn()
    end
end

---@param newOwner? number
function CVehicle:setOwner(newOwner)
    db.setOwner(newOwner, self.id)
    self.owner = newOwner
    self:getState():set('owner', newOwner, true)
end

---@param newGroup? string
function CVehicle:setGroup(newGroup)
    db.setGroup(newGroup, self.id)
    self.group = newGroup
end

local Class = require 'class'
return Class.new(CVehicle)
