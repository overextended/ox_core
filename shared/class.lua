local Class = {}

-- Private fields are not private in the traditional sense (only accessible to the class/object)
-- Instead it cannot be accessed by other resources (perhaps a new name would be better?)
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
        return setmetatable(obj, class)
    end

    if prototype.private then
        setmetatable(prototype.private, private_mt)
    end

    return class
end

return Class
