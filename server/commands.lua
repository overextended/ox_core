local vehicle = server.vehicle
local player = server.player

local function deleteVehicle(entity)
	local plate = GetVehicleNumberPlateText(entity)
	local veh = vehicle(plate)

	if veh then
		veh:store()
	else
		DeleteEntity(entity)
	end
end

lib.commands('group.admin', 'car', function(source, args)
	local ped = GetPlayerPed(source)
	local entity = GetVehiclePedIsIn(ped)

	if entity then
		local veh = vehicle(NetworkGetNetworkIdFromEntity(entity))

		if veh then
			veh:remove()
		else
			deleteVehicle(entity)
		end
	end

	if args.owner then
		args.owner = player(args.owner)
		if not args.owner then return end
	end

	local coords = GetEntityCoords(ped)
	local veh = vehicle.new(args.owner?.charid or false, {new = args.owner, model = joaat(args.model)}, coords.x, coords.y, coords.z, GetEntityHeading(ped))

	local timeout = 50
	repeat
		Wait(0)
		timeout -= 1
		SetPedIntoVehicle(ped, veh.entity, -1)
	until GetVehiclePedIsIn(ped, false) == veh.entity or timeout < 1
end, {'model:string', 'owner:?number'})

lib.commands('group.admin', 'dv', function(source)
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

local player = server.player

lib.commands('group.admin', 'setgroup', function(source, args)
	local obj = player(args.target)
	obj:setGroup(args.group, args.rank)
end, {'target:number', 'group:string', 'rank:number'})
