local Class = {}
_ENV.Class = Class

function Class.new()
    local class = {}

    function class:__index(index)
        local method = class[index]

        if method then
            return function(...)
                return method(self, ...)
            end
        end
    end

    return class
end
