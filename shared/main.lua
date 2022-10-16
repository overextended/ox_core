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

local modules = setmetatable({}, {
    __index = function(self, path)
        self[path] = false
        local scriptPath = ('%s/%s.lua'):format(lib.context, path:gsub('%.', '/'))
        local resourceFile = LoadResourceFile(cache.resource, scriptPath)

        if not resourceFile then
            self[path] = nil
            return error(("^1unable to load module at path '%s^0"):format(scriptPath), 3)
        end

        scriptPath = ('@@ox_core/%s'):format(scriptPath)
        local chunk, err = load(resourceFile, scriptPath)

        if err or not chunk then
            self[path] = nil
            return error(err or ("^1unable to load module at path '%s^0"):format(scriptPath), 3)
        end

        self[path] = chunk() or true
        return self[path]
    end
})

---@param modname string
---@return unknown
function require(modname)
    local module = modules[modname]

    if module == false then
        error(("^1circular-dependency occurred when loading module '%s'^0"):format(modname), 2)
    end

    return module
end
