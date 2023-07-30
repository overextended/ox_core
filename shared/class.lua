local Class = {}

-- Fields added to the "private" field on a class will not be msgpacked.
-- Use setters/getters when working with these values.
local private_mt = {
    __ext = 0,
    __pack = function() return '' end,
}

---@generic T
---@param prototype T
---@return { new: fun(obj): T}
function Class.new(prototype)
    local class = {
        __index = prototype
    }

    function class.new(obj)
        if obj.private then
            setmetatable(obj.private, private_mt)
        end

        return setmetatable(obj, class)
    end

    return class
end

return Class
