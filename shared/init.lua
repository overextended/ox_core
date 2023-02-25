local success, message = lib.checkDependency('ox_lib', '3.0.0')

if not success then
    return print(('^1Error: %s^0'):format(message))
end

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

local loaded = {}

package = {
    loaded = setmetatable({}, {
        __index = loaded,
        __newindex = function() end,
        __metatable = false,
    }),
    path = './?.lua;'
}

local _require = require

---Loads the given module inside the current resource, returning any values returned by the file or `true` when `nil`.
---@param modname string
---@return unknown
function require(modname)
    local module = loaded[modname]

    if not module then
        if module == false then
            error(("^1circular-dependency occurred when loading module '%s'^0"):format(modname), 2)
        end

        local success, result = pcall(_require, modname)

        if success then
            loaded[modname] = result
            return result
        end

        local modpath = modname:gsub('%.', '/')
        local paths = { string.strsplit(';', package.path) }

        for i = 1, #paths do
            local scriptPath = paths[i]:gsub('%?', modpath):gsub('%.+%/+', '')
            local resourceFile = LoadResourceFile(cache.resource, scriptPath)

            if resourceFile then
                loaded[modname] = false
                scriptPath = ('@@%s/%s'):format(cache.resource, scriptPath)

                local chunk, err = load(resourceFile, scriptPath)

                if err or not chunk then
                    loaded[modname] = nil
                    return error(err or ("unable to load module '%s'"):format(modname), 3)
                end

                module = chunk(modname) or true
                loaded[modname] = module

                return module
            end
        end

        return error(("module '%s' not found"):format(modname), 2)
    end

    return module
end

require 'shared.class'
require 'shared.vehicles'
