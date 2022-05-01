if IsDuplicityVersion() then return end

local ox_core = exports.ox_core

Ox = setmetatable({}, {
	__index = function(self, method)
		rawset(self, method, function(...)
			return ox_core[method](nil, ...)
		end)

		return self[method]
	end
})
