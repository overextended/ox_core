---@type table<string, CGroup>
local GroupRegistry = {}

---Return data associated with the given group name.
---@param name string
---@return CGroup?
function Ox.GetGroup(name)
    local group = GroupRegistry[name]

    if not group then
        print(("^1No group exists with name '%s'^0"):format(name))
    end

    return group
end

return GroupRegistry
