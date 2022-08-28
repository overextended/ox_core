Ox = setmetatable({}, {
    __newindex = function(self, name, fn)
        exports(name, fn)
        rawset(self, name, fn)
    end
})

Shared = {
    CHARACTER_SLOTS = GetConvarInt('ox:characterSlots', 5),
    DEBUG = GetConvarInt('ox:debug', 0) == 1,
}

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
