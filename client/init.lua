Client = {
	DEFAULT_SPAWN = vec4(-258.211, -293.077, 21.6132, 206.0),
    DEATH_SYSTEM = GetConvarInt('ox:deathSystem', 1) == 1,
    SPAWN_SELECT = GetConvarInt('ox:spawnSelect', 1) == 1,
    SPAWN_LOCATIONS = {
        vec4(394.503174, -713.933960, 29.285440, 268.384399),
        vec4(-1038.936401, -2739.876953, 13.852936, 328.259064),
        vec4(-491.354736, -697.363525, 33.241390, 0.049134),
    }
}

SetTimeout(500, function()
	exports.spawnmanager:spawnPlayer({
		x = Client.DEFAULT_SPAWN.x,
		y = Client.DEFAULT_SPAWN.y,
		z = Client.DEFAULT_SPAWN.z,
		heading = Client.DEFAULT_SPAWN.w,
		model = `mp_m_freemode_01`,
		skipFade = true,
	})

	exports.spawnmanager:setAutoSpawn(false)
	TriggerServerEvent('ox:playerJoined')
end)

local plateFormat = string.upper(GetConvar('ox:plateFormat', '........'))

for i = 0, 5 do
	SetDefaultVehicleNumberPlateTextPattern(i, plateFormat)
end
