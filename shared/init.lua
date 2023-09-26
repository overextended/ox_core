if not lib.checkDependency('ox_lib', '3.10.0', true) then return end

Ox = setmetatable({}, {
    __newindex = function(self, name, fn)
        exports(name, fn)
        rawset(self, name, fn)
    end
})

Shared = {
    SV_LAN = GetConvar('sv_lan', 'false') == 'true',
    CHARACTER_SLOTS = GetConvarInt('ox:characterSlots', 5),
}

Shared.DEBUG = Shared.SV_LAN or GetConvarInt('ox:debug', 0) == 1

---Throws a formatted type error
---@param variable string
---@param expected string
---@param received string
function TypeError(variable, expected, received)
    error(("expected %s to have type '%s' (received %s)"):format(variable, expected, received))
end

local expCache = {}

function GetExport(name)
    local exp = expCache[name]

    if exp then
        return exp
    end

    if GetResourceState(name) ~= 'missing' then
        expCache[name] = exports[name]
        return expCache[name]
    end
end

function json.load(file)
    local t = json.decode(LoadResourceFile(cache.resource, file) or '{}')

    if not t then
        error(('An unknown error occured while loading @%s/%s'):format(cache.resource, file), 2)
    end

    return t
end

require 'shared.vehicles'
