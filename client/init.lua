if not Shared then return end

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

local plateFormat = string.upper(GetConvar('ox:plateFormat', '........'))

for i = 0, 5 do
	SetDefaultVehicleNumberPlateTextPattern(i, plateFormat)
end
