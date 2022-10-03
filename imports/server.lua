local ox_core = exports.ox_core

Ox = setmetatable({}, {
    __index = function(self, index)
        self[index] = function(...)
            return ox_core[index](nil, ...)
        end

        return self[index]
    end
})

local function import(path)
    local file = ('imports/%s.lua'):format(path)
    local chunk, err = load(LoadResourceFile('ox_core', file), ('@@ox_core/%s'):format(file))

    if err or not chunk then
        error(err or ("Unable to load file '%s'"):format(file))
    end

    return chunk()
end

import 'server/player'
import 'server/vehicle'
