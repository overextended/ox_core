---@type OxServer
Ox = setmetatable({}, {
    __index = function(self, index)
        self[index] = function(...)
            return exports.ox_core[index](nil, ...)
        end

        return self[index]
    end
})

require 'lib.server.player'

return Ox
