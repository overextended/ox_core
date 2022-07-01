Ox = setmetatable({}, {
	__newindex = function(self, name, fn)
		exports(name, fn)
		rawset(self, name, fn)
	end
})

function Resource(name)
	return GetResourceState(name) ~= 'missing'
end

function json.load(file)
	local t = json.decode(LoadResourceFile(cache.resource, file))

	if not t then
		error(('An unknown error occured while loading @%s/%s'):format(cache.resource, file), 2)
	end

	return t
end
