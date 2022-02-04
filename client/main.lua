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
	}, function()
		cache.ped = PlayerPedId()
		cache.id = PlayerId()

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

		for i = 1, #characters do
			local character = characters[i]
			character.location = GetLabelText(GetNameOfZone(character.x, character.y, character.z))
		end

		SendNUIMessage({
			action = 'sendCharacters',
			data = characters
		})

		SetNuiFocus(true, true)
		SetNuiFocusKeepInput(false)

		RegisterRawNuiCallback('ox:newCharacter', function(data, cb)
			data = json.decode(data.body)

			if data.slot then
				DoScreenFadeOut(200)
			end

			SetNuiFocus(false, false)
			TriggerServerEvent('ox:selectCharacter', data)
			cb({ body = '{}'})
			UnregisterRawNuiCallback('ox:newCharacter')
		end)
	end)
end)

AddEventHandler('ox:newCharacter', function(slot)
	TriggerServerEvent('ox:selectCharacter', slot, {firstname = 'John', lastname = 'Smith', dateofbirth = '1990-01-01', gender = 'male'})
end)

RegisterNetEvent('ox:playerLoaded', function(data, coords, appearance)
	SetEntityCoordsNoOffset(cache.ped, coords.x, coords.y, coords.z, true, true, true)
	SetEntityHeading(cache.ped, coords.w or 357.165)
	RenderScriptCams(false, false, 0, true, true)
	DestroyCam(cache.cam, false)

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

	Wait(0)
	local playerState = LocalPlayer.state

	local police = GlobalState['group:police']
	print(police.label, police.ranks[playerState.police])

	local ox = GlobalState['group:ox']
	print(ox.label, ox.ranks[playerState.ox])

	Wait(500)
	DoScreenFadeIn(200)
end)

AddEventHandler('ox:playerLogout', function()
	table.wipe(cache)
end)

CreateThread(function()
	TriggerServerEvent('ox:playerJoined')
end)

RegisterCommand('saveveh', function()
	local data = lib.getVehicleProperties(GetVehiclePedIsUsing(PlayerPedId()))
	TriggerServerEvent('saveProperties', data)
end)
