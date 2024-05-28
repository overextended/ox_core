-- Temporary backwards compatibility, to be removed..
if not lib then return end

local Ox = require '@ox_core.lib.init'

---@deprecated
player = setmetatable({}, {
    __index = function(_, index)
        local player = Ox.GetPlayer()

        if index == 'groups' then return player.getGroups() end

        return player[index] or player.get(index)
    end,
    __newindex = function(_, index, value) Ox.GetPlayer()[index] = value end,
})

return Ox
