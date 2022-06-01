lib.addCommand('group.admin', 'setgroup', function(source, args)
	Ox.SetPlayerGroup(args.target, args.group, args.grade)
end, {'target:number', 'group:string', 'grade:number'})
