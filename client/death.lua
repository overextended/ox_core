local hospitals = {
    vec4(340.5, -1396.8, 32.5, 60.1),
    vec4(-449.3, -340.2, 34.5, 76.2),
    vec4(295.6, -583.9, 43.2, 79.5),
    vec4(1840.1, 3670.7, 33.9, 207.6),
    vec4(1153.2, -1526.4, 34.8, 352.4),
    vec4(-244.7, 6328.3, 32.4, 242.1),
}

local anims = {
    {'missfinale_c1@', 'lying_dead_player0'},
    {'veh@low@front_ps@idle_duck', 'sit'},
    {'dead', 'dead_a'},
}

function OnPlayerDeath(login)
    player.dead = true

    for i = 1, #anims do
        lib.requestAnimDict(anims[i][1])
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
        while player.dead do
            DisableFirstPersonCamThisFrame()
            Wait(0)
        end
    end)

    local coords = GetEntityCoords(cache.ped) --[[@as vector]]

    NetworkResurrectLocalPlayer(coords.x, coords.y, coords.z, GetEntityHeading(cache.ped), false, false)

    if cache.vehicle then
        SetPedIntoVehicle(cache.ped, cache.vehicle, cache.seat)
    end

    SetEntityInvincible(cache.ped, true)
    SetEntityHealth(cache.ped, 100)
    SetPlayerHealthRechargeMultiplier(cache.playerId, 0.0)
    SetEveryoneIgnorePlayer(cache.playerId, true)

    local playerState = LocalPlayer.state
    playerState.dead = true
    local timeout = 50
    local bleedOut

    while player.dead do
        local anim = cache.vehicle and anims[2] or anims[1]

        if not IsEntityPlayingAnim(cache.ped, anim[1], anim[2], 3) then
            TaskPlayAnim(cache.ped, anim[1], anim[2], 8.0, 8.0, -1, 1, 1.0, false, false, false)
        end

        timeout -= 1
        if timeout < 1 then
            player.dead = false
            bleedOut = true
        end

        Wait(200)
    end

    coords = vec4(GetEntityCoords(cache.ped).xyz, GetEntityHeading(cache.ped)) --[[@as vector]]

    if bleedOut then
        local closest, distance = {}

        for i = 1, #hospitals do
            local hospital = hospitals[i]
            distance = #(coords - hospital)

            if not next(closest) or distance < closest.dist then
                closest.coords = hospital
                closest.dist = distance
            end
        end

        coords = closest.coords --[[@as vector]]
    end

    DoScreenFadeOut(800)

    while not IsScreenFadedOut() do
        Wait(50)
    end

    NetworkResurrectLocalPlayer(coords.x, coords.y, coords.z, coords.w, false, false)

    if cache.vehicle and not bleedOut then
        SetPedIntoVehicle(cache.ped, cache.vehicle, cache.seat)
    end

    ClearPedBloodDamage(cache.ped)
    SetEntityHealth(cache.ped, GetEntityMaxHealth(cache.ped))
    SetEntityInvincible(cache.ped, false)
    SetPlayerHealthRechargeMultiplier(cache.playerId, 1.0)
    SetEveryoneIgnorePlayer(cache.playerId, false)

    AnimpostfxStop('DeathFailOut')
    Wait(2000)
    DoScreenFadeIn(800)

    playerState.dead = false

    ClearPedTasks(cache.ped)
    TriggerServerEvent('ox:playerDeath', false)
end
