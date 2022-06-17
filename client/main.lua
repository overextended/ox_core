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

RegisterNUICallback('ox:selectCharacter', function(data, cb)
	cb(1)

	if type(data) == 'number' then
		data += 1
		PlayerData.appearance = PlayerData.appearance[data]
		Wait(200)
		DoScreenFadeOut(200)
	end

	SetNuiFocus(false, false)
	TriggerServerEvent('ox:selectCharacter', data)
end)

RegisterNUICallback('ox:deleteCharacter', function(data, cb)
	cb(1)
	TriggerServerEvent('ox:deleteCharacter', data)
end)

RegisterCommand('saveveh', function()
	local data = lib.getVehicleProperties(GetVehiclePedIsUsing(PlayerPedId()))
	TriggerServerEvent('saveProperties', data)
end)
