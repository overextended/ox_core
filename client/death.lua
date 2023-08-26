local hospitals = {
    vec4(340.5, -1396.8, 32.5, 60.1),
    vec4(-449.3, -340.2, 34.5, 76.2),
    vec4(295.6, -583.9, 43.2, 79.5),
    vec4(1840.1, 3670.7, 33.9, 207.6),
    vec4(1153.2, -1526.4, 34.8, 352.4),
    vec4(-244.7, 6328.3, 32.4, 242.1),
}

local anims = {
    { 'missfinale_c1@', 'lying_dead_player0' },
    { 'veh@low@front_ps@idle_duck', 'sit' },
    { 'dead', 'dead_a' },
}

local playerState = LocalPlayer.state

function onPlayerDeath()
    PlayerIsDead = true
    playerState.dead = true

    for i = 1, #anims do
        lib.requestAnimDict(anims[i][1])
    end

    local scaleform = lib.requestScaleformMovie('MP_BIG_MESSAGE_FREEMODE') --[[@as number]]

    AnimpostfxPlay('DeathFailOut', 0, true)
    TriggerEvent('ox_inventory:disarm')
    TriggerEvent('ox:playerDeath', true)
    TriggerServerEvent('ox:playerDeath', true)
    PlaySoundFrontend(-1, 'MP_Flash', 'WastedSounds', false)
    ShakeGameplayCam('DEATH_FAIL_IN_EFFECT_SHAKE', 1.0)

    Wait(1900)

    local wasted = true
    CreateThread(function()
        Wait(4100)
        wasted = false
    end)

    BeginScaleformMovieMethod(scaleform, 'SHOW_SHARD_WASTED_MP_MESSAGE')
    BeginTextCommandScaleformString('STRING')
    AddTextComponentSubstringPlayerName('~r~wasted')
    EndTextCommandScaleformString()
    EndScaleformMovieMethod()

    PlaySoundFrontend(-1, 'PROPERTY_PURCHASE', 'HUD_AWARDS', false)

    while wasted do
        DisableFirstPersonCamThisFrame()
        DrawScaleformMovieFullscreen(scaleform, 255, 255, 255, 255, 0)
        Wait(0)
    end

    CreateThread(function()
        while PlayerIsDead do
            DisableFirstPersonCamThisFrame()
            Wait(0)
        end
    end)

    local coords = GetEntityCoords(cache.ped) --[[@as vector]]
    NetworkResurrectLocalPlayer(coords.x, coords.y, coords.z, GetEntityHeading(cache.ped), false, false)
    cache.ped = PlayerPedId()

    if cache.vehicle then
        SetPedIntoVehicle(cache.ped, cache.vehicle, cache.seat)
    end

    SetEntityInvincible(cache.ped, true)
    SetEntityHealth(cache.ped, 100)
    SetEveryoneIgnorePlayer(cache.playerId, true)

    local timeout = 50
    local bleedOut

    while PlayerIsDead do
        local anim = cache.vehicle and anims[2] or anims[1]

        if not IsEntityPlayingAnim(cache.ped, anim[1], anim[2], 3) then
            TaskPlayAnim(cache.ped, anim[1], anim[2], 50.0, 8.0, -1, 1, 1.0, false, false, false)
        end

        timeout -= 1
        if timeout < 1 then
            PlayerIsDead = false
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
    cache.ped = PlayerPedId()

    if cache.vehicle and not bleedOut then
        SetPedIntoVehicle(cache.ped, cache.vehicle, cache.seat)
    end

    ClearPedBloodDamage(cache.ped)
    SetEntityInvincible(cache.ped, false)
    SetEveryoneIgnorePlayer(cache.playerId, false)
    AnimpostfxStop('DeathFailOut')
    Wait(2000)
    DoScreenFadeIn(800)
    ClearPedTasks(cache.ped)

    playerState.dead = false

    TriggerEvent('ox:playerDeath', false)
    TriggerServerEvent('ox:playerDeath', false)
end

local function startDeathLoop()
    while PlayerIsLoaded do
        Wait(200)
        cache.ped = PlayerPedId()

        if not PlayerIsDead and IsPedDeadOrDying(cache.ped, false) then
            onPlayerDeath()
        end
    end
end

return startDeathLoop
