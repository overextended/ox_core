IsDuplicityVersion = IsDuplicityVersion()

Ox = setmetatable({}, {
	__newindex = function(self, name, fn)
		exports(name, fn)
		rawset(self, name, fn)
	end
})

shared = {
	resource = 'ox_core',
	spawn = vec4(-258.211, -293.077, 21.6132, 206.0),
	animatedDeath = true,
}

shared.ready = setmetatable({ready = false}, {
	__call = function(self, cb)
		if not self[1] then
			CreateThread(function()
				repeat Wait(50) until GetResourceState(shared.resource) == 'started'
				for i=1, #self do
					self[i]()
				end
				self = nil
			end)
		end
		self[#self+1] = cb
	end
})

if IsDuplicityVersion then
	server = {}
else
	client = {}
end
