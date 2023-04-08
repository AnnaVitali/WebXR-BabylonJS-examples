const canvas = document.getElementById("renderCanvas");
const engine = new BABYLON.Engine(canvas, true);

const createScene = async function () {//in this function put everything thet is in the scene
    const scene = new BABYLON.Scene(engine);
    scene.clearColor = new BABYLON.Color3.Black;

    const alpha = -Math.PI / 2;//Math.PI/4;
    const beta = Math.PI / 2;
    const radius = 2;
    const target = new BABYLON.Vector3(0, 0, 0);

    const sphere = createNewHologram(scene);
    var hologramList = [sphere];

    const camera = new BABYLON.ArcRotateCamera("Camera", alpha, beta, radius, target, scene);//camera that can be rotated around a target
    camera.attachControl(canvas, true);

    const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(1, 1, 0));
    light.intensity = 1; //lowering the intensity of the light

    //MRTK element
    var manager = new BABYLON.GUI.GUI3DManager(scene)

    const buttonParams = [
        { name: "Blue", color: BABYLON.Color3.Blue() },
        { name: "Red", color: BABYLON.Color3.Red() },
        { name: "Green", color: BABYLON.Color3.Green() },
        { name: "Purple", color: BABYLON.Color3.Purple() },
        { name: "Yellow", color: BABYLON.Color3.Yellow() },
        { name: "Teal", color: BABYLON.Color3.Teal() },
    ]

    //To add a WebXR support, we need to call createDefaultXRExperienceAsync, has a promise result
    const supported = await BABYLON.WebXRSessionManager.IsSessionSupportedAsync('immersive-ar')

    if (supported) {
        console.log("IMMERSIVE AR SUPPORTED");
        const xrHelper = await scene.createDefaultXRExperienceAsync({
            uiOptions: {
                sessionMode: 'immersive-ar',
                referenceSpaceType: "local-floor"
            }
        });
    } else {
        console.log("IMMERSIVE VR SUPPORTED")
        const xrHelper =  await scene.createDefaultXRExperienceAsync({
            uiOptions: {
                sessionMode: 'immersive-vr',
            }
        });
    }
   
    try {
        xrHelper.baseExperience.featuresManager.enableFeature(BABYLON.WebXRFeatureName.HAND_TRACKING, "latest", { xrInput: xr.input });
    } catch (err) {
        console.log("Articulated hand tracking not supported in this browser.");
    }

    manager.useRealisticScaling = true;

    // Create Near Menu with Touch Holographic Buttons + behaviour
    var nearMenu = new BABYLON.GUI.NearMenu("NearMenu");
    nearMenu.rows = 3;
    manager.addControl(nearMenu);
    nearMenu.isPinned = true;
    nearMenu.position.x = -0.2;
    nearMenu.position.y = 1.3;
    nearMenu.position.z = 1;

    addNearMenu(nearMenu, hologramList, buttonParams);

    var touchHoloButton = new BABYLON.GUI.TouchHolographicButton("TouchHoloButton");
    manager.addControl(touchHoloButton);
    touchHoloButton.position = new BABYLON.Vector3(-0.3, 1.3, 1);
    touchHoloButton.text = "Add hologram";
    touchHoloButton.imageUrl = "https://github.com/microsoft/MixedRealityToolkit-Unity/blob/main/Assets/MRTK/StandardAssets/Icons/shapes_icon.png";
    
    console.log(touchHoloButton.position);

    touchHoloButton.onPointerDownObservable.add(() => {
        const hologram = createNewHologram(scene);
        hologramList.push(hologram);
    });

    console.log("Done, WebXR is enabled.");
    return scene;
   
};

const createNewHologram = function (scene) {
    const boxMaterial = new BABYLON.StandardMaterial("material", scene);
    boxMaterial.diffuseColor = BABYLON.Color3.Random();

    const sphere = BABYLON.MeshBuilder.CreateSphere("sphere", { diameter: 0.2, segments: 32 }, scene);
    sphere.position.x = 0;
    sphere.position.y = 1.3;
    sphere.position.z = 1;
    sphere.material = boxMaterial; //add color to the box

    //create bounding box and object controls
    const boundingBox = BABYLON.BoundingBoxGizmo.MakeNotPickableAndWrapInBoundingBox(sphere);
    var utilLayer = new BABYLON.UtilityLayerRenderer(scene)
    utilLayer.utilityLayerScene.autoClearDepthAndStencil = false;
    const gizmo = new BABYLON.BoundingBoxGizmo(BABYLON.Color3.FromHexString("#0984e3"), utilLayer)
    gizmo.rotationSphereSize = 0.03;
    gizmo.scaleBoxSize = 0.03;
    gizmo.attachedMesh = boundingBox;

    // Create behaviors to drag and scale with pointers in VR
    var sixDofDragBehavior = new BABYLON.SixDofDragBehavior()
    boundingBox.addBehavior(sixDofDragBehavior)
    var multiPointerScaleBehavior = new BABYLON.MultiPointerScaleBehavior()
    boundingBox.addBehavior(multiPointerScaleBehavior)

    return sphere;
}

const addNearMenu = function (menu, targets, buttonParams) {
    console.log(targets);
    buttonParams.forEach(button => {
        input = new BABYLON.GUI.TouchHolographicButton();
        input.text = button.name;
        input.onPointerDownObservable.add(() => {
            targets.forEach(target => {
                target.material.diffuseColor = button.color
            });
        });
        menu.addButton(input);
    })
}

createScene().then(sceneToRender => {
    engine.runRenderLoop(() => sceneToRender.render());
});
