-----------------------------------------------------------------------------------------------
--	Module
-----------------------------------------------------------------------------------------------

local vehicle = {
	count = 0,
	list = {},
}

setmetatable(vehicle, {
	__add = function(self, obj)
		self.list[obj.netid] = obj
		self.count += 1
	end,

	__sub = function(self, obj)
		self.list[obj.netid] = nil
		self.count -= 1
	end,

	__call = function(self, netid)
		return self.list[netid]
	end
})

local Query = {
	SELECT_VEHICLES = 'SELECT charid, data, x, y, z, heading FROM vehicles WHERE stored = "false"',
	UPDATE_VEHICLES = 'UPDATE vehicles SET x = ?, y = ?, z = ?, heading = ? WHERE plate = ?',
	STORE_VEHICLE = 'UPDATE vehicles SET stored = ? WHERE plate = ?',
	VEHICLE_EXISTS = 'SELECT 1 FROM vehicles WHERE plate = ?',
	INSERT_VEHICLE = 'INSERT into vehicles (plate, charid, type, x, y, z, heading, data) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
	DELETE_VEHICLE = 'DELETE FROM vehicles WHERE plate = ?',
}

local CVehicle = {}
CVehicle.__index = CVehicle
CVehicle.__newindex = CVehicle

---Removes the vehicle from the database and deletes the entity.
function CVehicle:remove()
	if self.owner then
		MySQL.update(Query.DELETE_VEHICLE, { self.plate })
	end

	DeleteEntity(self.entity)
	return vehicle - self
end

local function generatePlate()
	local str = {}

	for i = 1, 2 do
		str[i] = string.char(math.random(48, 57))
	end

	for i = 3, 6 do
		str[i] = string.char(math.random(65, 90))
	end

	for i = 7, 8 do
		str[i] = string.char(math.random(48, 57))
	end

	return table.concat(str)
end

---@param store any
---Sets the vehicle as stored and deletes the entity.
function CVehicle:store(store)
	if self.owner then
		MySQL.update(Query.STORE_VEHICLE, { store or 'impound', self.plate })
	end

	DeleteEntity(self.entity)
	return vehicle - self
end

---@param charid number
---@param data table
---@param vehicleType string
---@param x number
---@param y number
---@param z number
---@param heading number
---@param plate string
---@return table data
---Generates a suitable license plate and inserts a vehicle into the database.
local function generateVehicleData(charid, data, vehicleType, x, y, z, heading, plate)
	if not plate or MySQL.scalar.await(Query.VEHICLE_EXISTS, { plate }) then
		repeat
			plate = generatePlate()
		until not MySQL.scalar.await(Query.VEHICLE_EXISTS, { plate })
	end

	data.new = nil
	data.plate = plate
	MySQL.prepare(Query.INSERT_VEHICLE, { plate, charid, vehicleType, x or 0.0, y or 0.0, z or 0.0, heading or 0.0, json.encode(data) })

	return data
end

---@param charid number
---@param data table
---@param x number
---@param y number
---@param z number
---@param heading number
---@return table vehicle
---Creates an instance of CVehicle. Loads existing vehicle data from the database, or generates new data.
function vehicle.new(charid, data, x, y, z, heading)
	local entity

	if x and y and z then
		entity = Citizen.InvokeNative(`CREATE_AUTOMOBILE`, data.model, x, y, z, heading or 90.0)
		Wait(0)
	end

	if entity then
		local vehicleType = GetVehicleType(entity)
		if not vehicleType then return end

		if charid and data.new then
			data = generateVehicleData(charid, data, vehicleType, x, y, z, heading, data.plate)
		else
			data.plate = generatePlate()
		end

		if x and y and z then
			local entityOwner = NetworkGetEntityOwner(entity)

			if data.charid then
				if entityOwner < 1 then
					DeleteEntity(entity)
					return MySQL.prepare(Query.STORE_VEHICLE, { 'impound', data.plate })
				end

				SetVehicleNumberPlateText(entity, data.plate)
			end

			local self = setmetatable({
				owner = charid,
				data = data,
				plate = data.plate,
				entity = entity,
				netid = NetworkGetNetworkIdFromEntity(entity),
			}, CVehicle)

			Entity(entity).state.owner = charid
			TriggerClientEvent('lualib:setVehicleProperties', entityOwner, self.netid, data)

			return self, vehicle + self
		end
	end
end

---Saves all data stored in vehicle.list and deletes the entities.  
---Should only be used when stopping the core.
function vehicle.saveAll()
	local parameters = {}
	local size = 0

	for _, obj in pairs(vehicle.list) do
		if obj.owner then
			size += 1
			local coords = GetEntityCoords(obj.entity)
			parameters[size] = { coords.x, coords.y, coords.z, GetEntityHeading(obj.entity), obj.plate }
		end
		DeleteEntity(obj.entity)
	end

	if size > 0 then
		MySQL.prepare(Query.UPDATE_VEHICLES, parameters)
	end
end

---Creates an instance of CVehicle for all unstored vehicles.  
---Should only be used when starting the core.
function vehicle.load()
	local vehicles = MySQL.query.await(Query.SELECT_VEHICLES)

	for i = 1, #vehicles do
		local obj = vehicles[i]
		vehicle.new(obj.charid, json.decode(obj.data), obj.x, obj.y, obj.z, obj.heading)
	end

	-- Wait(5000)
	-- local coords = GetEntityCoords(GetPlayerPed(2))
	-- local obj = vehicle.new(1, {model = -295689028, new = true}, coords.x, coords.y, coords.z, 357.16534423828125)
	-- print(json.encode(obj, {indent=true}))
	-- Wait(2000)
	-- obj:remove()
end

-- RegisterNetEvent('saveProperties', function(data)
-- 	print(json.encode(data, {indent=true}))
-- 	MySQL.query('UPDATE vehicles SET data = ? WHERE plate = ?', { json.encode(data), plate })
-- end)

-- RegisterCommand('dv', function()
-- 	for plate, vehicle in pairs(vehicle.list) do
-- 		vehicle:store()
-- 	end
-- end)

-----------------------------------------------------------------------------------------------
--	Interface
-----------------------------------------------------------------------------------------------

for name, method in pairs(CVehicle) do
	if type(method) == 'function' and name ~= '__call' then
		exports('vehicle_'..name, method)
		print('registered export:', 'vehicle_'..name)
	end
end

exports('getVehicle', function(netId)
	return vehicle.list[netId]
end)

exports('getVehicles', function()
	local size = 0
	local vehicles = {}

	for _, v in pairs(vehicle.list) do
		size += 1
		vehicles[size] = v
	end

	return vehicles
end)

server.vehicle = vehicle
