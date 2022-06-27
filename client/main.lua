PlayerData = {}

function Ox.IsPlayerLoaded()
	return PlayerData.loaded
end

function Ox.GetPlayerData()
	return PlayerData
end

NetEventHandler('ox:setGroup', function(name, grade)
	PlayerData.groups[name] = grade
end)

RegisterCommand('saveveh', function()
	local data = lib.getVehicleProperties(GetVehiclePedIsUsing(PlayerPedId()))
	TriggerServerEvent('saveProperties', data)
end)
