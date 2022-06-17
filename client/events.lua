function NetEventHandler(event, fn)
	RegisterNetEvent(event, function(...)
		if source ~= '' then fn(...) end
	end)
end
