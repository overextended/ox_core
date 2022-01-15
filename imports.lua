local function init()
    local isServer = IsDuplicityVersion()
    local exports = exports.core
    Ox = setmetatable({}, {
        __index = function(self, method)
            rawset(self, method, function(...)
                return exports[method](nil, ...)
            end)

            return self[method]
        end
    })

    local function playerMethod(self, index)
        return function(...)
            return exports['player_'..index](_, self, ...)
        end
    end

    function Ox.Player(source)
        local player = Ox.getPlayer(source)
        if not player then error(source..' is not a player') end
        return setmetatable(player, {
            __index = playerMethod
        })
    end

    if isServer then

    else

    end
end

AddEventHandler('onResourceStart', function(resource)
    if resource == 'core' then
        init()
    end
end)

init()