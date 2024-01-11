if not lib then return end

return require(('@ox_core.lib.%s.init'):format(lib.context))
