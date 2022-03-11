lib.addCommand('group.admin', 'setgroup', function(source, args)
	local obj = player(args.target)

	if obj then
		obj:setGroup(args.group, args.rank)
	end
end, {'target:number', 'group:string', 'rank:number'})
