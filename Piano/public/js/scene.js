const canvas = document.getElementById("renderCanvas");
const engine = new BABYLON.Engine(canvas, true);


const createScene = async function(engine){// async in order to use the await keyword inside it
	const scale = 0.015;
	const scene = new BABYLON.Scene(engine);

	const alpha = 3 * Math.PI/2;
	const beta = Math.PI/50;
	const radious = 220 * scale;//scale the radious
	const target = new BABYLON.Vector3(0, 0, 0);//the target is the center of the scene
	
	const camera = new BABYLON.ArcRotateCamera("Camera", alpha, beta, radious, target, scene);
	camera.attachControl(canvas, true);

	//hemispheric light points to the sky and is useful for simulating an ambient in space
	const light = new BABYLON.HemisphericLight("Light", new BABYLON.Vector3(0, 1, 0), scene);
	light.intensity = 0.6; //lowering the intensity of the light

	const keyParams = [
		{type: "white", note: "C", topWidth: 1.4, bottomWidth: 2.3, topPositionX: -0.45, wholePositionX: -14.4},
		{type: "black", note: "C#", wholePositionX: -13.45},
		{type: "white", note: "D", topWidth: 1.4, bottomWidth: 2.4, topPositionX: 0, wholePositionX: -12},
		{type: "black", note: "D#", wholePositionX: -10.6},
		{type: "white", note: "E", topWidth: 1.4, bottomWidth: 2.3, topPositionX: 0.45, wholePositionX: -9.6},
		{type: "white", note: "F", topWidth: 1.3, bottomWidth: 2.4, topPositionX: -0.55, wholePositionX: -7.2},
		{type: "black", note: "F#", wholePositionX: -6.35},
		{type: "white", note: "G", topWidth: 1.3, bottomWidth: 2.3, topPositionX: -0.2, wholePositionX: -4.8},
		{type: "black", note: "G#", wholePositionX: -3.6},
		{type: "white", note: "A", topWidth: 1.3, bottomWidth: 2.3, topPositionX: 0.2, wholePositionX: -2.4},
		{type: "black", note: "A#", wholePositionX: -0.85},
		{type: "white", note: "B", topWidth: 1.3, bottomWidth: 2.4, topPositionX: 0.55, wholePositionX: 0},
	]

	// Transform Node that acts as the parent of all piano keys
	const keyboard = new BABYLON.TransformNode("keyboard");

	/*placing all the key relative to the origin of the space
	Simple piano
	keyParams.forEach(key => {
		buildKey(scene, keyboard, Object.assign({register: 4, referencePositionX: 0}, key));
	});
	*/

	//Piano with 88 keys
	//register 1 to 7
	var referencePositionX = -2.4 * 14;
	for(let register = 1; register <= 7; register++){
		keyParams.forEach(key => {
			buildKey(scene, keyboard, Object.assign({register: register, referencePositionX: referencePositionX}, key));
		});
		referencePositionX += 2.4 * 7;
	}

	// Register 0
	buildKey(scene, keyboard, {type: "white", note: "A", topWidth: 1.9, bottomWidth: 2.3, topPositionX: -0.20, wholePositionX: -2.4, register: 0, referencePositionX: -2.4*21});
	keyParams.slice(10, 12).forEach(key => {
		buildKey(scene, keyboard, Object.assign({register: 0, referencePositionX: -2.4 * 21}, key));
		buildKey(scene, keyboard, Object.assign({register: 0, referencePositionX: -2.4 * 21}, key));
	})

	/*the left-most key and the right-most key of the piano keybord don't fit into the dimensions
	of the props defined in keyParams (because they are not next to a black key at the edge)
	*/
	// Register 8
	buildKey(scene, keyboard, {type: "white", note: "C", topWidth: 2.3, bottomWidth: 2.3, topPositionX: 0, wholePositionX: -2.4*6, register: 8, referencePositionX: 84});

	const piano = new BABYLON.TransformNode("piano");
	keyboard.parent = piano;

	BABYLON.SceneLoader.ImportMesh("frame", "https://raw.githubusercontent.com/MicrosoftDocs/mixed-reality/docs/mixed-reality-docs/mr-dev-docs/develop/javascript/tutorials/babylonjs-webxr-piano/files/", "pianoFrame.babylon", scene, function(meshes) {
		const frame = meshes[0];
		frame.parent = piano;
	});

	keyboard.position.y += 80;

	scaleFromPivot(piano, new BABYLON.Vector3(0, 0, 0), scale);

	//we will be using only the pointerdown and pointerup events to prigram the behaviour of the piano keys
	const pointerToKey = new Map();//useful to know which key release after the pointer is released
	const pianoSound = await Soundfont.instrument(new AudioContext(), 'acoustic_grand_piano');
	scene.onPointerObservable.add((pointerInfo) => {
		switch(pointerInfo.type){
			case BABYLON.PointerEventTypes.POINTERDOWN:	
				/*
				When the pointer is down on a piano key, move the piano key downward (to show that it is pressed)
				and play the sound of the note
				*/
				if(pointerInfo.pickInfo.hit){
					const pickedMesh = pointerInfo.pickInfo.pickedMesh;
					const pointerId = pointerInfo.event.pointerId;
					if(pickedMesh.parent === keyboard){
						pickedMesh.position.y -= 0.5;//effect of pressing the piano key
						pointerToKey.set(pointerId, {
							mesh: pickedMesh,
							note: pianoSound.play(pointerInfo.pickInfo.pickedMesh.name)
						});
					}
				}
				break;
			case BABYLON.PointerEventTypes.POINTERUP:
				/*
				When the pointer is released, move the piano key upwoard to its original position and
				stop the sound of the note of the key that is released.
				*/
				const pointerId = pointerInfo.event.pointerId;
				if(pointerToKey.has(pointerId)){
					pointerToKey.get(pointerId).mesh.position.y += 0.5;
					//stop the sound of the note of the key that is released
					pointerToKey.get(pointerId).note.stop();
					pointerToKey.delete(pointerId);
				}
				break;
		}
	});

	const xrHelper = await scene.createDefaultXRExperienceAsync(); //IMPORTANT POINT FOR CREATING AN WEBXR EXPERIENCE

	//WEBXR features
	const featureManager = xrHelper.baseExperience.featuresManager;

	const pointerSelection = featureManager.enableFeature(BABYLON.WebXRFeatureName.POINTER_SELECTION, "stable", {
		xrInput: xrHelper.input,
		enablePointerSelectionOnAllControllers: true
	});

	return scene;
}

/*
	scene = scene that the key is in
	parent = parent of the mesh, this allow us to group all keys together to a single parent
	props = properties of the key that will be built
*/
const buildKey = function (scene, parent, props){
	if(props.type === "white"){
		/*Props for buildn a white key should contain:
		note, topWidth, bottomWidth, topPositionX, wholePositionX, register, referencePositionX
		props for a white key:
			type = white
			name = the name of the note which the key represents
			topWidth = width of the top part
			bottomWidth = width of the bottom part
			topPositonX = x-position of the top part relative to the bottom part
			wholePositionX = x-position of the whole key relative to the end point of the register
			register = register that the key belongs to (a number between 0 and 8)
			referencePositionX = x-coordinate of the end point of the register (used as a reference point)
		*/

		//create bottom part
		const bottom = BABYLON.MeshBuilder.CreateBox("whyteKeyBottom", {width: props.bottomWidth, height: 1.5, depth: 4.5}, scene);

		//create top part
		const top = BABYLON.MeshBuilder.CreateBox("whiteKeyTop", {width: props.topWidth, height: 1.5, depth: 5}, scene);
		top.position.z = 4,75;
		top.position.x += props.topPositionX;

		//Merge bottom and top parts
		//parametrs of BABYLON.Mesh.MergeMeshes: (arrayOfMeshes, disposeSource, allow32BitsIndices, meshSubclass, subdivideWithSubMeshes, multiMultiMaterials)
		const key = BABYLON.Mesh.MergeMeshes([bottom, top], true, false, null, false, false);
		key.position.x = props.referencePositionX + props.wholePositionX
		key.name = props.note + props.register;
		key.parent = parent

		return key;
	}
	else if (props.type === "black"){
	/* Props for the black key contains the following item
		type = black
		name = the name of the note which the key represents
		wholePositionX = x-position of the whole key relative to the end point of hte register (right edge of the key B)
		referencePositionX = x-coordinate od the end point of the register (used as a reference point)
	*/
		const blackMat = new BABYLON.StandardMaterial("black");
		blackMat.diffuseColor = new BABYLON.Color3(0, 0, 0);

		//create black key
		const key = BABYLON.MeshBuilder.CreateBox(props.note + props.register, {width: 1.4, height: 2, depth: 5}, scene);
		key.position.z += 4.75;
		key.position.y += 0.25;
		key.position.x = props.referencePositionX + props.wholePositionX;
		key.material = blackMat;
		key.parent = parent;

		return key;
	}
}

/*
	Use this function to scale the piano frame and keys by a factor of 0.015, with a pivot point at the origin
	transformNode = the TransformNode to be scaled
	pivotPoint = a Vector3 object which indicates the point that the scaling is relative to
	scale = the scale factor
*/
const scaleFromPivot = function(transformNode, pivotPoint, scale){
	const sx = scale / transformNode.scaling.x;
	const sy = scale / transformNode.scaling.y;
	const sz = scale / transformNode.scaling.z;

	transformNode.scaling = new BABYLON.Vector3(sx, sy, sz);
	transformNode.position = new BABYLON.Vector3(pivotPoint.x + sx * (transformNode.position.x - pivotPoint.x), pivotPoint.y + sy * (transformNode.position.y - pivotPoint.y), pivotPoint.z + sz * (transformNode.position.z - pivotPoint.z));
}

createScene(engine).then(sceneToRender => {
	engine.runRenderLoop(() => sceneToRender.render()); //the scene to render may change
});

window.addEventListener("resize", function(){
	engine.resize();
});



