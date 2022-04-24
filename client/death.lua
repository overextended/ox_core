local hospitals = {
	vec(340.5, -1396.8, 32.5, 60.1),
	vec(-449.3, -340.2, 34.5, 76.2),
	vec(295.6, -583.9, 43.2, 79.5),
	vec(1840.1, 3670.7, 33.9, 207.6),
	vec(1153.2, -1526.4, 34.8, 352.4),
	vec(-244.7, 6328.3, 32.4, 242.1),
}

local anims = {
	{'missfinale_c1@', 'lying_dead_player0'},
	{'veh@low@front_ps@idle_duck', 'sit'},
	{'dead', 'dead_a'},
}

local function updateVehicle(cache)
	cache.vehicle = GetVehiclePedIsIn(cache.ped, false)
	if cache.vehicle > 0 then
		if not cache.seat or GetPedInVehicleSeat(cache.vehicle, cache.seat) ~= cache.ped then
			for i = -1, GetVehicleMaxNumberOfPassengers(cache.vehicle) - 1 do
				if GetPedInVehicleSeat(cache.vehicle, i) == cache.ped then
					cache.seat = i
					break
				end
			end
		end
	end
	return cache
end

function client.onPlayerDeath(cache, login)
	cache.dead = true

	if shared.animatedDeath then
		for i = 1, #anims do
			lib.requestAnimDict(anims[i][1])
		end
	end

	local scaleform = RequestScaleformMovie('MP_BIG_MESSAGE_FREEMODE')
	while not HasScaleformMovieLoaded(scaleform) and not login do
		Wait(10)
	end

	AnimpostfxPlay('DeathFailOut', 0, true)
	TriggerEvent('ox_inventory:disarm')

	if not login then
		TriggerServerEvent('ox:playerDeath', true)

		PlaySoundFrontend(-1, 'MP_Flash', 'WastedSounds')
		ShakeGameplayCam('DEATH_FAIL_IN_EFFECT_SHAKE', 1.0)

		Wait(1900)

		local wasted = true
		CreateThread(function()
			Wait(4100)
			wasted = false
		end)

		PushScaleformMovieFunction(scaleform, 'SHOW_SHARD_WASTED_MP_MESSAGE')
		BeginTextComponent('STRING')
		AddTextComponentString('~r~wasted')
		EndTextComponent()
		PopScaleformMovieFunctionVoid()

		PlaySoundFrontend(-1, 'PROPERTY_PURCHASE', 'HUD_AWARDS')
		while wasted do
			DisableFirstPersonCamThisFrame()
			DrawScaleformMovieFullscreen(scaleform, 255, 255, 255, 255)
			Wait(0)
		end
		-- perhaps add a flash so that the lack of animation isn't visible before it's set
	end

	CreateThread(function()
		while cache.dead do
			DisableFirstPersonCamThisFrame()
			Wait(0)
		end
	end)

	if shared.animatedDeath then
		cache = updateVehicle(cache)
		local coords = GetEntityCoords(cache.ped)

		NetworkResurrectLocalPlayer(coords.x, coords.y, coords.z, GetEntityHeading(cache.ped), false, false)
		if cache.vehicle then
			SetPedIntoVehicle(cache.ped, cache.vehicle, cache.seat)
		end

		SetEntityInvincible(cache.ped, true)
		SetEntityHealth(cache.ped, 100)
		SetPlayerHealthRechargeMultiplier(PlayerId(), 0.0)
		SetEveryoneIgnorePlayer(PlayerId(), true)
	end

	local playerState = LocalPlayer.state
	playerState.dead = true
	local timeout = 50
	local bleedOut

	while cache.dead do
		if shared.animatedDeath then
			cache.ped = PlayerPedId()

			local anim
			if cache.vehicle ~= 0 then
				anim = anims[2]
			else
				anim = anims[1]
			end

			if not IsEntityPlayingAnim(cache.ped, anim[1], anim[2], 3) then
				TaskPlayAnim(cache.ped, anim[1], anim[2], 8.0, 8.0, -1, 1, 1.0, false, false, false)
			end
			cache = updateVehicle(cache)
		end

		timeout -= 1
		if timeout < 1 then
			cache.dead = false
			bleedOut = true
		end

		Wait(200)
	end

	local coords = vec(GetEntityCoords(cache.ped).xyz, GetEntityHeading(cache.ped))
	if bleedOut then
		local closest, distance = {}
		for i = 1, #hospitals do
			local hospital = hospitals[i]
			distance = #(coords.xyz - hospital.xyz)
			if not next(closest) or distance < closest.dist then
				closest.coords = hospital
				closest.dist = distance
			end
		end
		coords = closest.coords
	end

	DoScreenFadeOut(800)

	while not IsScreenFadedOut() do
		Wait(50)
	end

	cache = updateVehicle(cache)
	NetworkResurrectLocalPlayer(coords.x, coords.y, coords.z, coords.w, false, false)
	if cache.vehicle and not bleedOut then
		SetPedIntoVehicle(cache.ped, cache.vehicle, cache.seat)
	end

	ClearPedBloodDamage(cache.ped)
	SetEntityHealth(cache.ped, GetEntityMaxHealth(cache.ped))
	SetEntityInvincible(cache.ped, false)
	SetPlayerHealthRechargeMultiplier(PlayerId(), 1.0)
	SetEveryoneIgnorePlayer(PlayerId(), false)

	AnimpostfxStop('DeathFailOut')
	Wait(2000)
	DoScreenFadeIn(800)

	playerState.dead = false
	ClearPedTasks(cache.ped)
	TriggerServerEvent('ox:playerDeath', false)
end
