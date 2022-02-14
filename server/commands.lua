local vehicle = server.vehicle

local function deleteVehicle(entity)
	local plate = GetVehicleNumberPlateText(entity)
	local veh = vehicle(plate)

	if veh then
		veh:store()
	else
		DeleteEntity(entity)
	end
end

local Command = import.commands

Command('admin', 'car', function(source, args)
	local ped = GetPlayerPed(source)
	local entity = GetVehiclePedIsIn(ped)

	if entity then
		local obj = vehicle(NetworkGetNetworkIdFromEntity(entity))

		if obj then
			obj:remove()
		else
			deleteVehicle(entity)
		end
	end

	local coords = GetEntityCoords(ped)
	local obj = vehicle.new(false, {model = joaat(args.model)}, coords.x, coords.y, coords.z, GetEntityHeading(ped))

	local timeout = 50
	repeat
		Wait(0)
		timeout -= 1
		SetPedIntoVehicle(ped, obj.entity, -1)
	until GetVehiclePedIsIn(ped, false) == obj.entity or timeout < 1
end, {'model:string'})

Command('admin', 'dv', function(source)
	local ped = GetPlayerPed(source)
	local entity = GetVehiclePedIsIn(ped)

	if entity then
		local obj = vehicle(NetworkGetNetworkIdFromEntity(entity))

		if obj then
			obj:remove()
		else
			deleteVehicle(entity)
		end
	end
end)
