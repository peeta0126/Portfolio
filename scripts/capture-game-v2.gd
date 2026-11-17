extends SceneTree

# Run only against the isolated project copy, never the user's game workspace.
func _initialize() -> void:
	call_deferred("capture")

func capture() -> void:
	root.size = Vector2i(1280, 720)
	var scene = load("res://scenes/main.tscn").instantiate()
	root.add_child(scene)
	await create_timer(1.0).timeout
	scene.start_game_world()
	await create_timer(1.0).timeout
	await RenderingServer.frame_post_draw
	var output = OS.get_cmdline_user_args()[0]
	var error = root.get_texture().get_image().save_png(output)
	print("Portfolio real game capture: ", error)
	quit(error)
