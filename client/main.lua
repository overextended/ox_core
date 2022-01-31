local cache = {
	id = PlayerId()
}

ExecuteCommand('ensure zf_context')

RegisterNetEvent('ox:selectCharacter', function(characters)
	if cache then TriggerEvent('ox:playerLogout') end

	cache.ped = PlayerPedId()
	local coords = vec4(-1380.316, 735.389, 182.967, 357.165)

	SetEntityCoords(cache.ped, coords.x, coords.y, coords.z)
	SetEntityHeading(cache.ped, coords.w)

	local camCoords = GetOffsetFromEntityInWorldCoords(cache.ped, 0.0, 5.0, -0.6)
	cache.cam = CreateCameraWithParams('DEFAULT_SCRIPTED_CAMERA', camCoords.x, camCoords.y, camCoords.z, 0.0, 0.0, 0.0, 30.0, false, 0)

	SetCamActive(cache.cam, true)
	RenderScriptCams(cache.cam, false, 0, true, true)
	PointCamAtCoord(cache.cam, coords.x, coords.y, coords.z)
	DoScreenFadeIn(200)

	CreateThread(function()
		local concealed = {}
		local playerId = PlayerId()
		SetPlayerInvincible(playerId, true)

		while cache.cam do
			DisableAllControlActions(0)
			ThefeedHideThisFrame()
			HideHudAndRadarThisFrame()

			local players = GetActivePlayers()

			for i = 1, #players do
				local player = players[i]
				if player ~= playerId and not concealed[player] then
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

	local menu = {}
	local size = #characters

	for i=1, size do
		local character = characters[i]
		menu[i] = {
			id = i,
			header = 'Select character',
			txt = (character.firstname and (character.firstname..' '..character.lastname) or '')..'  Location: '..GetLabelText(GetNameOfZone(character.x, character.y, character.z)),
			params = {
				event = 'ox:selectCharacter',
				isServer = true,
				args = i
			}
		}
	end

	if size < 4 then
		size = size+1
		menu[size] = {
			id = size,
			header = 'Create character',
			params = {
				event = 'ox:newCharacter',
				args = size
			}
		}
	end

	exports.zf_context:openMenu(menu)
end)

AddEventHandler('ox:newCharacter', function(slot)
	TriggerServerEvent('ox:selectCharacter', slot, {firstname = 'John', lastname = 'Smith', dateofbirth = '1990-01-01', gender = 'male'})
end)

RegisterNetEvent('ox:playerLoaded', function(data, coords, appearance)
	DoScreenFadeOut(200)
	Wait(500)
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
	DoScreenFadeOut(0)
	Wait(500)
	TriggerServerEvent('ox:playerJoined')
end)
