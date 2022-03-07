IsDuplicityVersion = IsDuplicityVersion()
shared = {
	resource = 'ox_core',
	selection = vec4(2486.3608, 3760.6089, 42.2486, 81.3602),
	spawn = vec4(-258.211, -293.077, 21.6132, 206.0),
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
