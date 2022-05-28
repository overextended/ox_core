RegisterNetEvent('ox:selectCharacter', function(characters)

	if GetIsLoadingScreenActive() then
		SendLoadingScreenMessage(json.encode({
			fullyLoaded = true
		}))

		ShutdownLoadingScreenNui()

		while GetIsLoadingScreenActive() do
			DoScreenFadeOut(0)
			Wait(0)
		end
	end

	while not IsScreenFadedOut() do
		DoScreenFadeOut(0)
		Wait(0)
	end

	if cache.id then
		table.wipe(cache)
		TriggerEvent('ox:playerLogout')
	end

	CreateThread(function()
		local concealed = {}

		while not cache.loaded do
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

	cache.id = PlayerId()

	SetPlayerInvincible(cache.id, true)
	StartPlayerTeleport(cache.id, shared.spawn.x, shared.spawn.y, shared.spawn.z, shared.spawn.w, false, true)

	while IsPlayerTeleportActive() do Wait(0) end

	if characters[1]?.appearance then
		exports['fivem-appearance']:setPlayerAppearance(characters[1].appearance)
	else
		cache.hidePlayer = true
	end

	cache.ped = PlayerPedId()

	local offset = GetOffsetFromEntityInWorldCoords(cache.ped, 0.0, 4.7, 0.2)
	cache.cam = CreateCameraWithParams('DEFAULT_SCRIPTED_CAMERA', offset.x, offset.y, offset.z, 0.0, 0.0, 0.0, 30.0, false, 0)

	SetCamActive(cache.cam, true)
	RenderScriptCams(cache.cam, false, 0, true, true)
	PointCamAtCoord(cache.cam, shared.spawn.x, shared.spawn.y, shared.spawn.z + 0.1)

	cache.appearance = {}

	for i = 1, #characters do
		local character = characters[i]
		character.location = GetLabelText(GetNameOfZone(character.x, character.y, character.z))
		cache.appearance[i] = character.appearance
		character.appearance = nil
	end

	SendNUIMessage({
		action = 'sendCharacters',
		data = characters
	})

	DoScreenFadeIn(500)
	Wait(500)
	SetNuiFocus(true, true)
	SetNuiFocusKeepInput(false)
end)

RegisterNetEvent('ox:playerLoaded', function(data, spawn)
	Wait(500)
	RenderScriptCams(false, false, 0, true, true)
	DestroyCam(cache.cam, false)
	cache.hidePlayer = false

	if not cache.appearance or not cache.appearance.model then
		local p = promise.new()

		exports['fivem-appearance']:startPlayerCustomization(function(appearance)
			if appearance then
				TriggerServerEvent('ox_appearance:save', appearance)
			end
			p:resolve()
		end, { ped = true, headBlend = true, faceFeatures = true, headOverlays = true, components = true, props = true, tattoos = true })

		Citizen.Await(p)
	end

	if spawn then
		StartPlayerTeleport(cache.id, spawn.x, spawn.y, spawn.z, spawn.w, false, true)
		while IsPlayerTeleportActive() do Wait(0) end
	else
		StartPlayerTeleport(cache.id, shared.spawn.x, shared.spawn.y, shared.spawn.z, shared.spawn.w, false, true)
	end

	cache = data
	cache.id = PlayerId()
	cache.ped = PlayerPedId()
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
