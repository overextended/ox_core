Ox = setmetatable({}, {
	__newindex = function(self, name, fn)
		exports(name, fn)
		rawset(self, name, fn)
	end
})

function Resource(name)
	return GetResourceState(name) ~= 'missing'
end
end
