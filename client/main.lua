local cache = {}

exports('IsPlayerLoaded', function()
	return cache.loaded
end)

RegisterNetEvent('ox:selectCharacter', function(characters)
	if cache then TriggerEvent('ox:playerLogout') end
	DoScreenFadeOut(0)

	exports.spawnmanager:spawnPlayer({
		x = shared.spawn.x,
		y = shared.spawn.y,
		z = shared.spawn.z,
		heading = shared.spawn.w,
		skipFade = true
	})

	client.setupCharacters(cache, characters)
	local concealed = {}

	while cache.cam do
		DisableAllControlActions(0)
		ThefeedHideThisFrame()
		HideHudAndRadarThisFrame()

		local players = GetActivePlayers()

		for i = 1, #players do
			local player = players[i]
			if player ~= cache.id and not concealed[player] then
				concealed[#concealed + 1] = player
				NetworkConcealPlayer(player, true, true)
			end
		end

		if cache.hidePlayer then
			SetLocalPlayerInvisibleLocally(true)
		end

		Wait(0)
	end

	for i = 1, #concealed do
		NetworkConcealPlayer(concealed[i], false, false)
	end

	DoScreenFadeIn(200)
	SetMaxWantedLevel(0)
	NetworkSetFriendlyFireOption(true)
	SetPlayerInvincible(cache.id, false)
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

RegisterNetEvent('ox:playerLoaded', function(data, spawn)
	client.playerLoaded(cache, spawn)

	cache = data
	cache.id = PlayerId()
	cache.loaded = true

	if cache.dead then
		client.onPlayerDeath(cache, true)
	end

	while cache.loaded do
		Wait(200)
		cache.ped = PlayerPedId()

		if not cache.dead and IsPedDeadOrDying(cache.ped) then
			client.onPlayerDeath(cache)
		end
	end
end)

AddEventHandler('ox:playerLogout', function()
	table.wipe(cache)
end)
