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

				if cache.hidePlayer then
					SetLocalPlayerInvisibleLocally(true)
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

RegisterRawNuiCallback('ox:setCharacter', function(data, cb)
	print(data.body)
	cb({ body = '{}'})
	data = json.decode(data.body)

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

RegisterRawNuiCallback('ox:deleteCharacter', function(data, cb)
	cb({ body = '{}'})
	TriggerServerEvent('ox:deleteCharacter', json.decode(data.body))
end)

RegisterNetEvent('ox:playerLoaded', function(data, spawn)
	Wait(500)

	local appearance = cache.appearance
	cache = data
	cache.id = PlayerId()

	RenderScriptCams(false, false, 0, true, true)
	DestroyCam(cache.cam, false)

	local p = promise.new()

	if not appearance.model then
		exports['fivem-appearance']:startPlayerCustomization(function(appearance)
			if appearance then
				TriggerServerEvent('fivem-appearance:save', appearance)
			end
			p:resolve()
		end, { ped = true, headBlend = true, faceFeatures = true, headOverlays = true, components = true, props = true })
	else
		exports['fivem-appearance']:setPlayerAppearance(appearance)
		p:resolve()
	end

	Citizen.Await(p)
	DoScreenFadeOut(200)
	cache.ped = PlayerPedId()

	if not spawn then
		spawn = shared.spawn
	end

	if spawn then
		SetEntityCoordsNoOffset(cache.ped, spawn.x, spawn.y, spawn.z, true, true, true)
		SetEntityHeading(cache.ped, spawn.w or 357.165)
	end

	DoScreenFadeIn(200)
end)

AddEventHandler('ox:playerLogout', function()
	table.wipe(cache)
end)

TriggerServerEvent('ox:playerJoined')
