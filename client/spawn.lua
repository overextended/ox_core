SetTimeout(100, function()
    TriggerServerEvent('ox:playerJoined')
end)

function client.setupCharacters(cache, characters)
	Wait(100)

	cache.ped = PlayerPedId()
	cache.id = PlayerId()

	SetPlayerInvincible(cache.id, true)
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
end

function client.playerLoaded(cache, spawn)
	Wait(500)
	RenderScriptCams(false, false, 0, true, true)
	DestroyCam(cache.cam, false)

	if not cache.appearance or not cache.appearance.model then
		local p = promise.new()
		cache.hidePlayer = false

		exports['fivem-appearance']:startPlayerCustomization(function(appearance)
			if appearance then
				TriggerServerEvent('fivem-appearance:save', appearance)
			end
			p:resolve()
		end, { ped = true, headBlend = true, faceFeatures = true, headOverlays = true, components = true, props = true })

		Citizen.Await(p)
	end

	DoScreenFadeOut(200)

	if not spawn then
		spawn = shared.spawn
	end

	cache.ped = PlayerPedId()
	if spawn then
		SetEntityCoordsNoOffset(cache.ped, spawn.x, spawn.y, spawn.z, true, true, true)
		SetEntityHeading(cache.ped, spawn.w or 357.165)
	end
end
