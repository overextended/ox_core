IsDuplicityVersion = IsDuplicityVersion()
shared = {
    resource = GetCurrentResourceName()
}

shared.ready = setmetatable({ready = false}, {
    __call = function(self, cb)
        if cb == true then
            self.ready = true
            return
        end
        if not self[1] then
            CreateThread(function()
                repeat Wait(0) until self.ready
                for i=1, #self do
                    self[i]()
                end
                self = nil
            end)
        end
        self[#self+1] = cb
    end
})

shared.onResourceStart = setmetatable({}, {
    __call = function(self, resource, callback)
        if callback then
            if not self[resource] then
                self[resource] = {}
            end

            self[resource][#self[resource]+1] = callback
        elseif self[resource] then
            for i = 1, #self[resource] do
                self[resource][i]()
            end
        end
    end
})

AddEventHandler(('on%sResourceStart'):format(IsDuplicityVersion and 'Server' or 'Client'), function(resource)
    shared.onResourceStart(resource)
end)

if IsDuplicityVersion then
    server = setmetatable({}, {__index = shared})
else
    client = setmetatable({}, {__index = shared})
end
