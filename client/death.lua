function client.onPlayerDeath(cache, login)
	cache.dead = true
	local anim = {'missfinale_c1@', 'lying_dead_player0'}
	lib.requestAnimDict(anim[1])

	if not login then
		local coords = GetEntityCoords(cache.ped)
		NetworkResurrectLocalPlayer(coords.x, coords.y, coords.z, GetEntityHeading(cache.ped), false, false)
		SetEntityHealth(cache.ped, GetEntityMaxHealth(cache.ped))
		TriggerServerEvent('ox:playerDeath', true)
	end

	local timeout = 20

	while cache.dead do
		cache.ped = PlayerPedId()

		if not IsEntityPlayingAnim(cache.ped, anim[1], anim[2], 3) then
			TaskPlayAnim(cache.ped, anim[1], anim[2], 8.0, 8.0, -1, 1, 1.0, false, false, false)
		end

		timeout -= 1
		if timeout < 1 then cache.dead = false end

		Wait(200)
	end

	ClearPedTasks(cache.ped)
	TriggerServerEvent('ox:playerDeath', false)
end
