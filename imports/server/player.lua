local ox_core = exports.ox_core
local CPlayer = {}
local PlayerExports = {}
setmetatable(PlayerExports, {
    __index = function(_, index)
        PlayerExports = Ox.PlayerExports()
        return PlayerExports[index]
    end
})

function CPlayer:__index(index)
    local method = CPlayer[index]

    if method then
        return function(...)
            return method(self, ...)
        end
    end

    local export = PlayerExports[index]

    if export then
        return function(...)
            return ox_core:CPlayer(self.source, index, ...)
        end
    end
end

function CPlayer:getPed()
    if update or not self.ped then
        self.ped = GetPlayerPed(self.source)
    end

    return self.ped
end

function CPlayer:getCoords(update)
    if update or not self.coords then
        self.coords = GetEntityCoords(self.getPed())
    end

    return self.coords
end

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

function CPlayer:getAccounts()
    return Ox.GetAccounts(self.charid)
end

function Ox.GetPlayer(player)
    player = type(player) == 'table' and player.charid or ox_core:GetPlayer(player)
    return player and setmetatable(player, CPlayer)
end

function Ox.GetPlayers(usemetatable, filter)
    local players = ox_core:GetPlayers(filter)

    if usemetatable then
        for i = 1, #players do
            setmetatable(players[i], CPlayer)
        end
    end

    return players
end
