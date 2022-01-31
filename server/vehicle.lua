-----------------------------------------------------------------------------------------------
--	Module
-----------------------------------------------------------------------------------------------

local CVehicle = {
	count = 0,
	list = {},
	new = true,
}

local Query = {
	SELECT_VEHICLES = 'SELECT owner, data, x, y, z, heading FROM vehicles WHERE stored = "false"',
	UPDATE_VEHICLES = 'UPDATE vehicles SET x = ?, y = ?, z = ?, heading = ? WHERE plate = ?',
	STORE_VEHICLE = 'UPDATE vehicles SET stored = ? WHERE plate = ?',
	VEHICLE_EXISTS = 'SELECT 1 FROM vehicles WHERE plate = ?',
	INSERT_VEHICLE = 'INSERT into vehicles (plate, owner, type, x, y, z, heading, data) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
	DELETE_VEHICLE = 'DELETE FROM vehicles WHERE plate = ?',
}


-----------------------------------------------------------------------------------------------
--	Class
-----------------------------------------------------------------------------------------------

local Class = {}
Class.__index = Class
Class.__newindex = Class
Class.__call = function(self, plate)
	return self.list[plate]
end

setmetatable(CVehicle, Class)

function CVehicle:remove()
	MySQL.update(Query.DELETE_VEHICLE, { self.data.plate })
	DeleteEntity(self.entity)
	CVehicle.list[self.data.plate] = nil
end

function CVehicle:store(store)
	MySQL.update(Query.STORE_VEHICLE, { store or 'impound', self.data.plate })
	DeleteEntity(self.entity)
	CVehicle.list[self.data.plate] = nil
end

function CVehicle.new(owner, data, x, y, z, heading)
	local entity

	if x and y and z then
		entity = Citizen.InvokeNative(`CREATE_AUTOMOBILE`, data.model, x, y, z, heading or 90.0)
		Wait(0)
	end

	if entity then

		local vehicleType = GetVehicleType(entity)
		if not vehicleType then return end

		if data.new then
			if not data.plate or MySQL.scalar.await(Query.VEHICLE_EXISTS, { data.plate }) then
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

					data.plate = table.concat(str)
				until not MySQL.scalar.await(Query.VEHICLE_EXISTS, { data.plate })
			end

			data.new = nil
			MySQL.prepare(Query.INSERT_VEHICLE, { data.plate, owner, vehicleType, x or 0.0, y or 0.0, z or 0.0, heading or 0.0, json.encode(data) })
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
					entity = entity,
					netid = NetworkGetNetworkIdFromEntity(entity),
				}, Class)

				CVehicle.list[data.plate] = self
				CVehicle.count += 1

				Entity(entity).state.owner = owner
				TriggerClientEvent('lualib:setVehicleProperties', entityOwner, self.netid, data)

				return self
			end
		end
	end
end


-----------------------------------------------------------------------------------------------
--	Interface
-----------------------------------------------------------------------------------------------

for name, method in pairs(Class) do
	if type(method) == 'function' and name ~= '__call' then
		exports('vehicle_'..name, method)
	end
end

exports('getVehicle', function(plate)
	return CVehicle.list[plate]
end)

exports('getVehicles', function()
	local size = 0
	local vehicles = {}

	for _, v in pairs(CVehicle.list) do
		size += 1
		vehicles[size] = v
	end

	return vehicles
end)

server.CVehicle = CVehicle


-----------------------------------------------------------------------------------------------
--	Events
-----------------------------------------------------------------------------------------------

AddEventHandler('onResourceStop', function(resource)
	if resource == 'ox_core' then
		local parameters = {}
		local size = 0

		for plate, vehicle in pairs(CVehicle.list) do
			size += 1
			local coords = GetEntityCoords(vehicle.entity)
			parameters[size] = { coords.x, coords.y, coords.z, GetEntityHeading(vehicle.entity), plate }
			DeleteEntity(vehicle.entity)
		end

		if size > 0 then
			MySQL.prepare(Query.UPDATE_VEHICLES, parameters)
		end
	end
end)

MySQL.ready(function()
	local vehicles = MySQL.query.await(Query.SELECT_VEHICLES)
	for i = 1, #vehicles do
		local vehicle = vehicles[i]
		vehicle = CVehicle.new(vehicle.owner, json.decode(vehicle.data), vehicle.x, vehicle.y, vehicle.z, vehicle.heading)
	end

	-- Wait(5000)
	-- local vehicle = CVehicle.new(1, {model = -295689028, new = true}, -1352.4527587890625,-1540.786865234375,4.4263916015625,357.16534423828125)
	-- print(json.encode(vehicle, {indent=true}))
	-- print(vehicle)
	-- Wait(2000)
	-- vehicle:remove()
end)

-- RegisterCommand('dv', function()
-- 	for plate, vehicle in pairs(CVehicle.list) do
-- 		vehicle:store()
-- 	end
-- end)
