local convar = {}

server.ready(function()
    print('convar')
end)

server.convar = convar
