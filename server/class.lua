local Class = {}
local type = type

---@generic T
---@param prototype T
---@return { new: fun(obj): T}
function Class.new(prototype)
    local class = {}

    function class.new(obj)
        return setmetatable(obj, class)
    end

    function class:__index(index)
        local value = prototype[index]

        if type(value) == 'function' then
            return function(...)
                return value(self, ...)
            end
        end

        return value
    end

    return class
end

_ENV.Class = Class
