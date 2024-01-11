---@class PlayerInterface
---@field private new fun(self: self, obj: table): self
---@field private __index fun(self: self, index: any): any
---@field private __tostring fun(self: self): string
---@field source number
---@field userId number
---@field username string
---@field identifier string
---@field test fun(...)
---@field localmethod fun(...)
local PlayerInterface = lib.class('PlayerInterface')

function PlayerInterface:__index(index)
    local value = PlayerInterface[index]

    if type(value) == 'function' then
        self[index] = value == PlayerInterface.__call and function(...)
            return value(self, index, ...)
        end or function(...)
            return value(self, ...)
        end

        return self[index]
    end

    return value
end

function PlayerInterface:__call(...)
    return exports.ox_core:callOxPlayer(self.source, ...)
end

function PlayerInterface:__tostring()
    return string.format('{\n  "source": %s\n  "userId": %s\n  "identifier": %s\n  "username": %s\n}', self.source,
        self.userId, self.identifier, self.username)
end

for method in pairs(exports.ox_core.getOxPlayerCalls() or {}) do
    PlayerInterface[method] = PlayerInterface.__call
end

function PlayerInterface:localmethod(...)
    print(...)
end

---@param id string | number
function Ox.GetPlayer(id)
    local player = exports.ox_core:getOxPlayer(id)

    if not player then return warn(string.format('cannot create PlayerInterface<%s> (invalid id)', id)); end

    return PlayerInterface:new(player or { source = tonumber(id) })
end
