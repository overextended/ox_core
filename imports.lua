local exports = exports.core
local IsDuplicityVersion = IsDuplicityVersion()

Ox = setmetatable({}, {
    __index = exports
})

local function playerMethod(self, index)
    return function(...)
        return exports['player_'..index](_, self, ...)
    end
end

function Ox.Player(source)
    local player = exports:getPlayer(source)
    if not player then error(source..' is not a player') end
    return setmetatable(player, {
        __index = playerMethod
    })
end

function Ox.Vehicle(entity)
    if not GetEntityType(entity) == 2 then error(entity..' is not a vehicle') end
    return setmetatable(exports:getVehicle(NetworkGetNetworkIdFromEntity(entity)), {
        __index = function(self, name)
            return exports['vehicle_'..name](_, self)
        end
    })
end

if IsDuplicityVersion then

else

end
