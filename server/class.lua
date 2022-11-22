local Class = {}

---@generic T
---@param prototype T
---@return { new: fun(obj): T}
function Class.new(prototype)
    local class = {
        __index = prototype
    }

    function class.new(obj)
        return setmetatable(obj, class)
    end

    return class
end

return Class
