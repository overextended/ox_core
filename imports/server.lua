local ox_core = exports.ox_core

Ox = setmetatable({}, {
    __index = function(self, index)
        self[index] = function(...)
            return ox_core[index](nil, ...)
        end

        return self[index]
    end
})

-----------------------------------------------------------------------------------------------
-- Player
-----------------------------------------------------------------------------------------------

local CPlayer = {}
local PlayerExports = {}
setmetatable(PlayerExports, {
    __index = function(_, index)
        PlayerExports = Ox.PlayerExports()
        return PlayerExports[index]
    end
})

function CPlayer:__index(index, ...)
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

function Ox.GetPlayer(player)
    player = type(player) == 'table' and player.charid or ox_core:GetPlayer(player)

    if not player then
        error(("no player exists with id '%s'"):format(player))
    end

    return setmetatable(player, CPlayer)
end

lib.getPlayer = Ox.GetPlayer

function Ox.GetPlayers(usemetatable, filter)
    local players = ox_core:GetPlayers(filter)

    if usemetatable then
        for i = 1, #players do
            setmetatable(players[i], CPlayer)
        end
    end

    return players
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

-----------------------------------------------------------------------------------------------
-- Vehicle
-----------------------------------------------------------------------------------------------

local CVehicle = {}
local VehicleExports = {}
setmetatable(VehicleExports, {
    __index = function(_, index)
        VehicleExports = Ox.VehicleExports()
        return VehicleExports[index]
    end
})

function CVehicle:__index(index, ...)
    local method = CVehicle[index]

    if method then
        return function(...)
            return method(self, ...)
        end
    end

    local export = VehicleExports[index]

    if export then
        return function(...)
            return ox_core:CVehicle(self.entity, index, ...)
        end
    end
end

function CVehicle:getCoords(update)
    if update or not self.coords then
        self.coords = GetEntityCoords(self.entity)
    end

    return self.coords
end

function Ox.GetVehicle(vehicle)
    vehicle = type(vehicle) == 'table' and vehicle.entity or ox_core:GetVehicle(vehicle)
    return vehicle and setmetatable(vehicle, CVehicle)
end

function Ox.GetVehicleFromNetId(vehicle)
    vehicle = ox_core:GetVehicleFromNetId(vehicle)
    return vehicle and setmetatable(vehicle, CVehicle)
end

function Ox.CreateVehicle(data, coords, heading)
    local vehicle = ox_core:CreateVehicle(data, coords, heading)
    return setmetatable(vehicle, CVehicle)
end

function Ox.GetVehicles(usemetatable)
    local vehicles = ox_core:GetVehicles()

    if usemetatable then
        for i = 1, #vehicles do
            setmetatable(vehicles[i], CVehicle)
        end
    end

    return vehicles
end
