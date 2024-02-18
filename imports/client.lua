-- Temporary backwards compatibility, to be removed..
if not lib then return end

local Ox = require '@ox_core.lib.client.init'

---@deprecated
player = setmetatable({}, {
    __index = function(self, index) return index == 'groups' and Ox.GetPlayer().getGroups() or Ox.GetPlayer()[index] end,
    __newindex = function(self, index, value) Ox.GetPlayer()[index] = value end,
})

return Ox
