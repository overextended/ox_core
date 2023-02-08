---@type table<string, OxGroup>
local GroupRegistry = {}

---Return data associated with the given group name.
---@param name string
---@return OxGroup?
function Ox.GetGroup(name)
    local group = GroupRegistry[name]

    if not group then
        print(("^1No group exists with name '%s'^0"):format(name))
    end

    return group
end

return GroupRegistry
