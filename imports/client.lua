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

local function registerNetEvent(event, fn)
	RegisterNetEvent(event, function(...)
		if source ~= '' then fn(...) end
	end)
end

local playerData = Ox.GetPlayerData()

registerNetEvent('ox:playerLoaded', function(data)
	playerData = data
end)

registerNetEvent('ox:setGroup', function(name, grade)
	playerData.groups[name] = grade
end)

local CPlayer = lib.getPlayer()

function lib.getPlayer()
	return setmetatable({
		id = cache.playerId,
		serverId = cache.serverId,
	}, CPlayer)
end

function CPlayer:hasGroup(filter)
	if type(filter) == 'string' then
		local grade = playerGroups[filter]

		if grade then
			return filter, grade
		end
	else
		local tabletype = table.type(filter)

		if tabletype == 'hash' then
			for group, minimumGrade in pairs(filter) do
				local grade = playerGroups[group]

				if grade and minimumGrade <= grade then
					return group, grade
				end
			end
		elseif tabletype == 'array' then
			for i = 1, #filter do
				local group = filter[i]
				local grade = playerGroups[filter[i]]

				if grade then
					return group, grade
				end
			end
		end
	end
end

player = lib.getPlayer()
