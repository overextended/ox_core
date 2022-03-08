lib.addCommand('group.admin', 'setgroup', function(source, args)
	local player = server.player(args.target)

	if player then
		player:setGroup(args.group, args.rank)
	end
end, {'target:number', 'group:string', 'rank:number'})
