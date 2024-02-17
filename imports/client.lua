-- Temporary backwards compatibility, to be removed..
if not lib then return end

local Ox = require '@ox_core.lib.client.init'

---@deprecated
player = setmetatable({}, {
    __index = function(self, index) return index == 'groups' and Ox.Player():getGroups() or Ox.Player()[index] end,
    __newindex = function(self, index, value) Ox.Player()[index] = value end,
})

return Ox
