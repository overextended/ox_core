local MySQL = MySQL

MySQL.ready(function()
    MySQL.query('UPDATE `vehicles` SET `stored` = ? WHERE `stored` IS NULL', { 'impound' })
end)

local db = {}

local DELETE_VEHICLE = 'DELETE FROM `vehicles` WHERE `id` = ?'
---Removes a vehicle from the database with the given id.
---@param id number
function db.deleteVehicle(id)
    MySQL.prepare(DELETE_VEHICLE, { id })
end

local INSERT_VEHICLE = 'INSERT INTO `vehicles` (`plate`, `vin`, `owner`, `group`, `model`, `class`, `data`, `stored`) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
---Creates a new database entry and returns the vehicleId.
---@param plate string
---@param owner? number | boolean
---@param group? string | boolean
---@param model string
---@param class number
---@param data table
---@param stored string?
---@return number?
function db.createVehicle(plate, vin, owner, group, model, class, data, stored)
    return MySQL.prepare.await(INSERT_VEHICLE, { plate, vin, owner or nil, group or nil, model, class, json.encode(data), stored }) --[[@as number?]]
end

local PLATE_EXISTS = 'SELECT 1 FROM `vehicles` WHERE `plate` = ?'
---Check if a plate is already in use.
---@param plate string
---@return boolean
function db.isPlateAvailable(plate)
    return not MySQL.scalar.await(PLATE_EXISTS, { plate })
end

local VIN_EXISTS = 'SELECT 1 FROM `vehicles` WHERE `vin` = ?'
---Check if a plate is already in use.
---@param vin string
---@return boolean
function db.isVinAvailable(vin)
    return not MySQL.scalar.await(VIN_EXISTS, { vin })
end

local SELECT_VEHICLE = 'SELECT `owner`, `group`, `plate`, `vin`, `model`, `data` FROM `vehicles` WHERE `id` = ? AND `stored` IS NOT NULL'
---Fetch vehicle data for the given id.
---@param id number
function db.getVehicleFromId(id)
    return MySQL.prepare.await(SELECT_VEHICLE, { id })
end

local UPDATE_STORED = 'UPDATE `vehicles` SET `stored` = ? WHERE `id` = ?'
---Updates a vehicle's stored state. nil is used when it is spawned, otherwise it can be a garage name, impound, etc.
---@param stored string?
---@param id number
function db.setStored(stored, id)
    MySQL.prepare.await(UPDATE_STORED, { stored, id })
end

local UPDATE_OWNER = 'UPDATE `vehicles` SET `owner` = ? WHERE `id` = ?'
---Updates a vehicle's owner.
---@param owner number?
---@param id number
function db.setOwner(owner, id)
    MySQL.prepare.await(UPDATE_OWNER, { owner or nil, id })
end

local UPDATE_GROUP = 'UPDATE `vehicles` SET `group` = ? WHERE `id` = ?'
---Updates a vehicle's owner.
---@param group string?
---@param id number
function db.setGroup(group, id)
    MySQL.prepare.await(UPDATE_GROUP, { group or nil, id })
end

local UPDATE_VEHICLE = 'UPDATE `vehicles` SET `stored` = ?, `data` = ? WHERE `id` = ?'
---Update vehicle data for one or multiple vehicles.
---@param parameters table<number, any> | table<number, any>[]
function db.updateVehicle(parameters)
    MySQL.prepare(UPDATE_VEHICLE, parameters)
end

local UPDATE_PLATE = 'UPDATE `vehicles` SET `plate` = ? WHERE `id` = ?'
---Update vehicle data for one or multiple vehicles.
---@param parameters { plate: string, id: number }
function db.setPlate(parameters)
    MySQL.prepare(UPDATE_PLATE, parameters)
end

return db
