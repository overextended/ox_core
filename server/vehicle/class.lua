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
---@field init fun(data: table)
---@field set fun(key: string, value: any)
---@field get fun(key: string): any
---@field getState fun(): { [string]: any, set: fun(self: table, key: string, value: any, replicated: boolean) }
---@field delete fun()
---@field despawn fun()
---@field setStored fun(value?: string, despawn?: boolean)
---@field setOwner fun(newOwner?: string)

---@type CVehicle
local CVehicle = Class.new()

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

function CVehicle:getState()
    return Entity(self.entity).state
end

function CVehicle:delete()
    Vehicle.despawn(self, true)
    vehicleData[self.entity] = nil
end

function CVehicle:despawn()
    Vehicle.despawn(self, nil, vehicleData[self.entity])
    vehicleData[self.entity] = nil
end

---@deprecated
function CVehicle:store(value)
    print(('^2vehicle.store has been deprecated and will be removed (invoked by %s)^0'):format(GetInvokingResource()))
    print('^2use vehicle.setStored(value, despawn) instead^0')
    self.stored = value or self.stored or 'impound'
    Vehicle.despawn(self, nil, vehicleData[self.entity])
    vehicleData[self.entity] = nil
end

local db = require 'vehicle.db'

function CVehicle:setStored(value, despawn)
    db.setStored(value, self.id)
    self.stored = value

    if despawn then
        self.despawn()
    end
end

function CVehicle:setOwner(newOwner)
    db.setOwner(newOwner, self.id)
    self.owner = newOwner
    self.getState():set('owner', newOwner, true)
end

return CVehicle
