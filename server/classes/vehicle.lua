-----------------------------------------------------------------------------------------------
--	Module
-----------------------------------------------------------------------------------------------

local vehicle = {
	count = 0,
	list = {},
}

setmetatable(vehicle, {
	__add = function(self, obj)
		self.list[obj.plate] = obj
		self.count += 1
	end,

	__sub = function(self, obj)
		self.list[obj.plate] = nil
		self.count -= 1
	end,

	__call = function(self, plate)
		return self.list[plate]
	end
})

local Query = {
	SELECT_VEHICLES = 'SELECT owner, data, x, y, z, heading FROM vehicles WHERE stored = "false"',
	UPDATE_VEHICLES = 'UPDATE vehicles SET x = ?, y = ?, z = ?, heading = ? WHERE plate = ?',
	STORE_VEHICLE = 'UPDATE vehicles SET stored = ? WHERE plate = ?',
	VEHICLE_EXISTS = 'SELECT 1 FROM vehicles WHERE plate = ?',
	INSERT_VEHICLE = 'INSERT into vehicles (plate, owner, type, x, y, z, heading, data) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
	DELETE_VEHICLE = 'DELETE FROM vehicles WHERE plate = ?',
}

local CVehicle = {}
CVehicle.__index = CVehicle
CVehicle.__newindex = CVehicle

function CVehicle:remove()
	MySQL.update(Query.DELETE_VEHICLE, { self.plate })
	DeleteEntity(self.entity)
	return vehicle - self
end

function CVehicle:store(store)
	MySQL.update(Query.STORE_VEHICLE, { store or 'impound', self.plate })
	DeleteEntity(self.entity)
	return vehicle - self
end

local function generateVehicleData(owner, data, vehicleType, x, y, z, heading, plate)
	if not plate or MySQL.scalar.await(Query.VEHICLE_EXISTS, { plate }) then
		repeat
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

			plate = table.concat(str)
		until not MySQL.scalar.await(Query.VEHICLE_EXISTS, { plate })
	end

	data.new = nil
	data.plate = plate
	MySQL.prepare(Query.INSERT_VEHICLE, { plate, owner, vehicleType, x or 0.0, y or 0.0, z or 0.0, heading or 0.0, json.encode(data) })

	return data
end

function vehicle.new(owner, data, x, y, z, heading)
	local entity

	if x and y and z then
		entity = Citizen.InvokeNative(`CREATE_AUTOMOBILE`, data.model, x, y, z, heading or 90.0)
		Wait(0)
	end

	if entity then
		local vehicleType = GetVehicleType(entity)
		if not vehicleType then return end

		if data.new then
			data = generateVehicleData(owner, data, vehicleType, x, y, z, heading, data.plate)
		end

		if x and y and z then
			local entityOwner = NetworkGetEntityOwner(entity)

			if entityOwner < 1 then
				DeleteEntity(entity)
				MySQL.prepare(Query.STORE_VEHICLE, { 'impound', data.plate })
			else
				SetVehicleNumberPlateText(entity, data.plate)

				local self = setmetatable({
					owner = owner,
					data = data,
					plate = data.plate,
					entity = entity,
					netid = NetworkGetNetworkIdFromEntity(entity),
				}, CVehicle)

				Entity(entity).state.owner = owner
				TriggerClientEvent('lualib:setVehicleProperties', entityOwner, self.netid, data)

				return self, vehicle + self
			end
		end
	end
end

function vehicle.saveAll()
	local parameters = {}
	local size = 0

	for plate, obj in pairs(vehicle.list) do
		size += 1
		local coords = GetEntityCoords(obj.entity)
		parameters[size] = { coords.x, coords.y, coords.z, GetEntityHeading(obj.entity), plate }
		DeleteEntity(obj.entity)
	end

	if size > 0 then
		MySQL.prepare(Query.UPDATE_VEHICLES, parameters)
	end
end

function vehicle.load()
	local vehicles = MySQL.query.await(Query.SELECT_VEHICLES)

	for i = 1, #vehicles do
		local obj = vehicles[i]
		vehicle.new(obj.owner, json.decode(obj.data), obj.x, obj.y, obj.z, obj.heading)
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
	end
end

exports('getVehicle', function(plate)
	return vehicle.list[plate]
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
