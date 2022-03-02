cache = {}

exports('IsPlayerLoaded', function()
	return cache.loaded
end)

RegisterNUICallback('ox:selectCharacter', function(data, cb)
	cb(1)

	if type(data) == 'number' then
		data += 1
		cache.appearance = cache.appearance[data]
		Wait(200)
		DoScreenFadeOut(200)
	end

	SetNuiFocus(false, false)
	TriggerServerEvent('ox:selectCharacter', data)
end)

RegisterNUICallback('ox:setCharacter', function(data, cb)
	cb(1)

	if type(data) == 'number' then
		data = cache.appearance[data + 1]

		if data then
			exports['fivem-appearance']:setPlayerAppearance(data)
			cache.hidePlayer = false
		end
	else
		cache.hidePlayer = true
	end
end)

RegisterNUICallback('ox:deleteCharacter', function(data, cb)
	cb(1)
	TriggerServerEvent('ox:deleteCharacter', data)
end)

RegisterCommand('saveveh', function()
	local data = lib.getVehicleProperties(GetVehiclePedIsUsing(PlayerPedId()))
	TriggerServerEvent('saveProperties', data)
end)
