local GroupRegistry = {}
_ENV.GroupRegistry = GroupRegistry

---Return data associated with the given group name.
---@param name string
---@return table?
function Ox.GetGroup(name)
    local group = GroupRegistry[name]

    if not group then
        if GetInvokingResource() ~= 'oxmysql' then
            error(("No group exists with name '%s'"):format(name))
        end

        print(("^1No group exists with name '%s'^0"):format(name))
    end

    return group
end
