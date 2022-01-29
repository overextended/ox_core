IsDuplicityVersion = IsDuplicityVersion()
shared = {
	resource = GetCurrentResourceName()
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
	server = setmetatable({}, {__index = shared})
else
	client = setmetatable({}, {__index = shared})
end
