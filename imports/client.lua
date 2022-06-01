if not lib.player then lib.player() end

local ox_core = exports.ox_core

Ox = setmetatable({}, {
    __index = function(self, index)
        self[index] = function(...)
            return ox_core[index](nil, ...)
        end

        return self[index]
    end
})

local CPlayer = lib.getPlayer()

function lib.getPlayer()
	return setmetatable({
		id = cache.playerId,
		serverId = cache.serverId,
	}, CPlayer)
end

local function registerNetEvent(event, fn)
	RegisterNetEvent(event, function(...)
		if source ~= '' then fn(...) end
	end)
end

if Ox.IsPlayerLoaded() then
	player = lib.getPlayer()

	for k, v in pairs(Ox.GetPlayerData()) do
		player[k] = v
	end
end

registerNetEvent('ox:playerLoaded', function(data)
	player = lib.getPlayer()

	for k, v in pairs(data) do
		player[k] = v
	end
end)

registerNetEvent('ox:setGroup', function(name, grade)
	player.groups[name] = grade
end)

function CPlayer:hasGroup(filter)
	local type = type(filter)

	if type == 'string' then
		local grade = self.groups[filter]

		if grade then
			return filter, grade
		end
	elseif type == 'table' then
		local tabletype = table.type(filter)

		if tabletype == 'hash' then
			for name, grade in pairs(filter) do
				local playerGrade = self.groups[name]

				if playerGrade and grade <= playerGrade then
					return name, playerGrade
				end
			end
		elseif tabletype == 'array' then
			for i = 1, #filter do
				local name = filter[i]
				local grade = self.groups[name]

				if grade then
					return name, grade
				end
			end
		end
	else
		error(("received '%s' when checking player group"):format(filter))
	end
end
