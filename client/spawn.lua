NetworkStartSoloTutorialSession()

CreateThread(function()
    if GetIsLoadingScreenActive() then
        SendLoadingScreenMessage('{"fullyLoaded": true}')
        ShutdownLoadingScreenNui()
    end

    while not IsScreenFadedOut() do
        DoScreenFadeOut(0)
        Wait(0)
    end

    ShutdownLoadingScreen()
    Wait(500)
    TriggerServerEvent('ox:playerJoined')
end)

local hidePlayer

local function setPlayerAsHidden(state)
    hidePlayer = state
    SetPedAoBlobRendering(cache.ped, not state)
end

local fivem_appearance = GetExport('fivem-appearance')

local function setPlayerAppearance(data)
    if not fivem_appearance then return end

    fivem_appearance:setPlayerAppearance(data)
end

local function startPlayerCustomisation(model)
    if not fivem_appearance then return end

    setPlayerAppearance({ model = model, tattoos = {} })

    local p = promise.new()

    fivem_appearance:startPlayerCustomization(function(response)
        if response then TriggerServerEvent('ox_appearance:save', response) end

        p:resolve()
    end, { ped = true, headBlend = true, faceFeatures = true, headOverlays = true, components = true, props = true, tattoos = true })

    Citizen.Await(p)
end

local cam

RegisterNUICallback('ox:setCharacter', function(data, cb)
	cb(1)

	if type(data) == 'number' then
		data = player.appearance[data + 1]

		if data then
			setPlayerAppearance(data)
			setPlayerAsHidden(false)
		end
	else
		setPlayerAsHidden(true)
	end
end)

RegisterNUICallback('loadLocale', function(_, cb)
    cb(1)
	local JSON = LoadResourceFile(cache.resource, ('locales/%s.json'):format(GetConvar('ox:locale', 'en'))) or LoadResourceFile(cache.resource, 'locales/en.json')

    SendNUIMessage({
        action = 'setLocale',
        data = json.decode(JSON)
    })
end)


RegisterNUICallback('ox:selectCharacter', function(data, cb)
	cb(1)

	if type(data) == 'number' then
		data += 1
		player.appearance = player.appearance[data]
		Wait(200)
		DoScreenFadeOut(200)
	end

	TriggerServerEvent('ox:selectCharacter', data)
end)

RegisterNUICallback('ox:deleteCharacter', function(data, cb)
	cb(1)
	setPlayerAsHidden(true)
	TriggerServerEvent('ox:deleteCharacter', data)
end)

RegisterNetEvent('ox:selectCharacter', function(characters)
	NetworkStartSoloTutorialSession()
    SetPlayerControl(cache.playerId, false, 0)
    SetPlayerInvincible(cache.playerId, true)
    DoScreenFadeOut(0)

    while not IsScreenFadedOut() do
        Wait(0)
    end

	if PlayerIsLoaded then
		table.wipe(player)
		TriggerEvent('ox:playerLogout')
        ClearPedTasks(cache.ped)
        Wait(500)
	end

	CreateThread(function()
		while not PlayerIsLoaded do
			DisableAllControlActions(0)
			ThefeedHideThisFrame()
			HideHudAndRadarThisFrame()

			if hidePlayer then
                SetLocalPlayerInvisibleLocally(true)
			end

			Wait(0)
		end
	end)

    SetEntityCoordsNoOffset(cache.ped, Client.DEFAULT_SPAWN.x, Client.DEFAULT_SPAWN.y, Client.DEFAULT_SPAWN.z, true, true, false)
	StartPlayerTeleport(cache.playerId, Client.DEFAULT_SPAWN.x, Client.DEFAULT_SPAWN.y, Client.DEFAULT_SPAWN.z, Client.DEFAULT_SPAWN.w, false, true, false)

	while not UpdatePlayerTeleport(cache.playerId) do Wait(0) end

    setPlayerAsHidden(true)

	local offset = GetOffsetFromEntityInWorldCoords(cache.ped, 0.0, 4.7, 0.2)
	cam = CreateCameraWithParams('DEFAULT_SCRIPTED_CAMERA', offset.x, offset.y, offset.z, 0.0, 0.0, 0.0, 30.0, false, 0)

	SetCamActive(cam, true)
	RenderScriptCams(true, false, 0, true, true)
	PointCamAtCoord(cam, Client.DEFAULT_SPAWN.x, Client.DEFAULT_SPAWN.y, Client.DEFAULT_SPAWN.z + 0.1)

	player.appearance = {}

	for i = 1, #characters do
		local character = characters[i]
		character.location = GetLabelText(GetNameOfZone(character.x, character.y, character.z))
		player.appearance[i] = character.appearance
		character.appearance = nil
	end

	SendNUIMessage({
		action = 'sendCharacters',
		data = {
			characters = characters,
			maxSlots = Shared.CHARACTER_SLOTS
		}
	})

	DoScreenFadeIn(500)
	Wait(500)
	SetNuiFocus(true, true)
	SetNuiFocusKeepInput(false)
end)

local startStatusLoop = require 'client.status'
local spawnLabels = {}

RegisterNUICallback('clickSpawn', function(data, cb)
	cb(1)
    ---@todo spawn scenes or some sort of camera magic
    -- local coords = Client.SPAWN_LOCATIONS[data + 1]

	-- RequestCollisionAtCoord(coords.x, coords.y, coords.z)
	-- SetEntityCoordsNoOffset(cache.ped, coords.x, coords.y, coords.z, false, false, false)
end)

local function spawnPlayer(coords)
    local ped = cache.ped

    NetworkEndTutorialSession()
	RequestCollisionAtCoord(coords.x, coords.y, coords.z)
	SetEntityCoordsNoOffset(cache.ped, coords.x, coords.y, coords.z, false, false, false)
    SetEntityHeading(ped, coords.w)
	FreezeEntityPosition(ped, true)
    SetGameplayCamRelativeHeading(0)

    while GetPlayerSwitchState() ~= 5 do Wait(0) end

    SwitchInPlayer(ped)

    while GetPlayerSwitchState() ~= 12 do Wait(0) end

    while not HasCollisionLoadedAroundEntity(ped) do Wait(0) end
	FreezeEntityPosition(ped, false)

    TriggerEvent('playerSpawned')
end

RegisterNUICallback('selectSpawn', function(data, cb)
	cb(1)
    spawnPlayer(Client.SPAWN_LOCATIONS[data + 1])
end)

---@param data table
---@param spawn vector4?
---@param health number?
---@param armour number?
RegisterNetEvent('ox:loadPlayer', function(spawn, data, health, armour, gender)
	Wait(500)
	RenderScriptCams(false, false, 0, true, true)
	DestroyCam(cam, false)

	cam = nil
	setPlayerAsHidden(false)

	if not player.appearance or not player.appearance.model then
        startPlayerCustomisation(gender == 'female' and 'mp_f_freemode_01' or 'mp_m_freemode_01')
		DoScreenFadeOut(200)
		Wait(500)
	end

    cache.ped = PlayerPedId()

    if Client.SPAWN_SELECT then
        if spawn then table.insert(Client.SPAWN_LOCATIONS, 1, spawn) end

        for i = 1, #Client.SPAWN_LOCATIONS do
            local coords = Client.SPAWN_LOCATIONS[i]
            spawnLabels[i] = GetLabelText(GetNameOfZone(coords.x, coords.y, coords.z))
        end
    end

    SwitchOutPlayer(cache.ped, 0, 1)

    while GetPlayerSwitchState() ~= 5 do Wait(50) end

    DoScreenFadeIn(300)
    SetEntityHealth(cache.ped, health or GetEntityMaxHealth(cache.ped))
    SetPedArmour(cache.ped, armour or 0)
    SetPlayerData(data)
    TriggerEvent('ox:playerLoaded', player)

    if Client.SPAWN_SELECT then
        SendNUIMessage({
            action = 'sendSpawns',
            data = spawnLabels
        })

        while IsPlayerSwitchInProgress() do Wait(50) end

        if spawn then
            table.remove(Client.SPAWN_LOCATIONS, 1)
        end
    else
        spawnPlayer(spawn or Client.DEFAULT_SPAWN)
    end

	SetNuiFocus(false, false)
    SetPlayerControl(cache.playerId, true, 0)
    SetPlayerInvincible(cache.playerId, false)
    SetMaxWantedLevel(0)
    NetworkSetFriendlyFireOption(true)
    SetPlayerHealthRechargeMultiplier(cache.playerId, 0.0)

    CreateThread(startStatusLoop)

    if Client.DEATH_SYSTEM then CreateThread(require 'client.death') end
end)
