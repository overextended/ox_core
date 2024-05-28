if not lib or Ox then return Ox end

---@type OxCommon
Ox = setmetatable({}, {
    __index = function(self, index)
        self[index] = function(...)
            return exports.ox_core[index](nil, ...)
        end

        return self[index]
    end
})

require(('@ox_core.lib.%s.init'):format(lib.context))

function Ox.GetGroup(name)
    return GlobalState['group.' .. name]
end

return Ox
