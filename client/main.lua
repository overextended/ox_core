local cache = {}

RegisterNetEvent('ox:selectCharacter', function(characters)
	if cache then TriggerEvent('ox:playerLogout') end
	DoScreenFadeOut(0)

	local coords = vec4(-1380.316, 735.389, 182.967, 357.165)
	cache.cam = CreateCameraWithParams('DEFAULT_SCRIPTED_CAMERA', coords.x, coords.y + 4.7, coords.z + 0.3, 0.0, 0.0, 0.0, 30.0, false, 0)

	SetCamActive(cache.cam, true)
	RenderScriptCams(cache.cam, false, 0, true, true)
	PointCamAtCoord(cache.cam, coords.x, coords.y, coords.z + 0.1)

	exports.spawnmanager:spawnPlayer({
		x = coords.x,
		y = coords.y,
		z = coords.z,
		heading = coords.w,
		skipFade = true
	}, function()
		cache.ped = PlayerPedId()
		cache.id = PlayerId()

		if characters[1]?.appearance then
			exports['fivem-appearance']:setPlayerAppearance(characters[1].appearance)
		end

		Wait(200)
		DoScreenFadeIn(500)

		CreateThread(function()
			local concealed = {}
			SetPlayerInvincible(playerId, true)

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

				Wait(0)
			end

			for i = 1, #concealed do
				NetworkConcealPlayer(concealed[i], false, false)
			end
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

		RegisterRawNuiCallback('ox:selectCharacter', function(data, cb)
			cb({ body = '{}'})
			data = json.decode(data.body)

			if type(data) == 'number' then
				data += 1
				cache.appearance = cache.appearance[data]
				Wait(200)
				DoScreenFadeOut(200)
			end

			SetNuiFocus(false, false)
			TriggerServerEvent('ox:selectCharacter', data)
			UnregisterRawNuiCallback('ox:selectCharacter')
		end)
	end)
end)

RegisterRawNuiCallback('ox:deleteCharacter', function(data, cb)
	cb({ body = '{}'})
	TriggerServerEvent('ox:deleteCharacter', json.decode(data.body))
end)

RegisterNetEvent('ox:playerLoaded', function(data, coords)
	SetEntityCoordsNoOffset(cache.ped, coords.x, coords.y, coords.z, true, true, true)
	SetEntityHeading(cache.ped, coords.w or 357.165)
	RenderScriptCams(false, false, 0, true, true)
	DestroyCam(cache.cam, false)

	local appearance = cache.appearance
	cache = data
	cache.id = PlayerId()

	if not appearance.model then
		exports['fivem-appearance']:startPlayerCustomization(function(appearance)
			if appearance then
				TriggerServerEvent('fivem-appearance:save', appearance)
			end
		end, { ped = true, headBlend = true, faceFeatures = true, headOverlays = true, components = true, props = true })
	else
		exports['fivem-appearance']:setPlayerAppearance(appearance)
	end

	Wait(500)
	DoScreenFadeIn(200)
end)

AddEventHandler('ox:playerLogout', function()
	table.wipe(cache)
end)

TriggerServerEvent('ox:playerJoined')
