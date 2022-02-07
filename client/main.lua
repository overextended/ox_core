local cache = {}

RegisterNetEvent('ox:selectCharacter', function(characters)
	if cache then TriggerEvent('ox:playerLogout') end
	DoScreenFadeOut(0)

	exports.spawnmanager:spawnPlayer({
		x = shared.spawn.x,
		y = shared.spawn.y,
		z = shared.spawn.z,
		heading = shared.spawn.w,
		skipFade = true
	}, function()
		cache.ped = PlayerPedId()
		cache.id = PlayerId()

		local offset = GetOffsetFromEntityInWorldCoords(cache.ped, 0.0, 4.7, 0.2)
		cache.cam = CreateCameraWithParams('DEFAULT_SCRIPTED_CAMERA', offset.x, offset.y, offset.z, 0.0, 0.0, 0.0, 30.0, false, 0)

		SetCamActive(cache.cam, true)
		RenderScriptCams(cache.cam, false, 0, true, true)
		PointCamAtCoord(cache.cam, shared.spawn.x, shared.spawn.y, shared.spawn.z + 0.1)

		if characters[1]?.appearance then
			exports['fivem-appearance']:setPlayerAppearance(characters[1].appearance)
		else
			cache.hidePlayer = true
		end

		Wait(200)
		DoScreenFadeIn(500)

		CreateThread(function()
			local concealed = {}
			SetPlayerInvincible(cache.id, true)

			-- Conceal other players during character selection
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

			-- Trigger setters after the player has spawned
			DoScreenFadeIn(200)
			SetMaxWantedLevel(0)
			NetworkSetFriendlyFireOption(true)
			SetPlayerInvincible(cache.id, false)
		end)

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

		SetNuiFocus(true, true)
		SetNuiFocusKeepInput(false)
	end)
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
	Wait(500)

	RenderScriptCams(false, false, 0, true, true)
	DestroyCam(cache.cam, false)

	local p = promise.new()

	if cache.appearance?.model then
		exports['fivem-appearance']:setPlayerAppearance(cache.appearance)
		p:resolve()
	else
		exports['fivem-appearance']:startPlayerCustomization(function(appearance)
			if appearance then
				TriggerServerEvent('fivem-appearance:save', appearance)
			end
			p:resolve()
		end, { ped = true, headBlend = true, faceFeatures = true, headOverlays = true, components = true, props = true })
	end

	Citizen.Await(p)
	DoScreenFadeOut(200)

	if not spawn then
		spawn = shared.spawn
	end

	cache = data
	cache.id = PlayerId()
	cache.ped = PlayerPedId()

	if spawn then
		SetEntityCoordsNoOffset(cache.ped, spawn.x, spawn.y, spawn.z, true, true, true)
		SetEntityHeading(cache.ped, spawn.w or 357.165)
	end
end)

AddEventHandler('ox:playerLogout', function()
	table.wipe(cache)
end)

TriggerServerEvent('ox:playerJoined')
