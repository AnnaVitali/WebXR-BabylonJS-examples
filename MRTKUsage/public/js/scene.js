const canvas = document.getElementById("renderCanvas");
const engine = new BABYLON.Engine(canvas, true);

const createScene = function() {//in this function put everything thet is in the scene
    const scene = new BABYLON.Scene(engine);
    scene.clearColor = new BABYLON.Color3.Black;

    const alpha =  Math.PI/4;
    const beta = Math.PI/3;
    const radius = 8;
    const target = new BABYLON.Vector3(0, 0, 0);

    const boxMaterial = new BABYLON.StandardMaterial("material", scene);
    boxMaterial.diffuseColor = BABYLON.Color3.Random();

    const box = BABYLON.MeshBuilder.CreateBox("box", {size:0.5});
    box.position.x = 0.5;
    box.position.y = 0.5;
    box.material = boxMaterial; //add color to the box

    box.actionManager = new BABYLON.ActionManager(scene);
    box.actionManager.registerAction(new BABYLON.ExecuteCodeAction(
        BABYLON.ActionManager.OnPickTrigger,
        function (evt){//function colled when clicked on the cube
            const sourceBox = evt.meshUnderPointer;
                
            //move the box upright
            sourceBox.position.x += 0.1;
            sourceBox.position.y += 0.1;
                    
            //update the color
            boxMaterial.diffuseColor = BABYLON.Color3.Random();
    }));

    const camera = new BABYLON.ArcRotateCamera("Camera", alpha, beta, radius, target, scene);//camera that can be rotated around a target
    camera.attachControl(canvas, true);

    const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(1, 1, 0));

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
    const xrPromise = scene.createDefaultXRExperienceAsync();

    return xrPromise.then((xrExperience) => {
        try {
            xrExperience.baseExperience.featuresManager.enableFeature(BABYLON.WebXRFeatureName.HAND_TRACKING, "latest", { xrInput: xr.input });
        } catch (err) {
            console.log("Articulated hand tracking not supported in this browser.");
        }

        manager.useRealisticScaling = true;

        // Create Near Menu with Touch Holographic Buttons + behaviour
        var nearMenu = new BABYLON.GUI.NearMenu("NearMenu");
        nearMenu.rows = 3;
        manager.addControl(nearMenu);
        nearMenu.isPinned = true;
        nearMenu.position.y = 1.61;

        addNearMenuButtons(nearMenu, box, buttonParams);

        console.log("Done, WebXR is enabled.");
        return scene;
    });       
};

const addNearMenu = function (menu, target, buttonParams) {
    buttonParams.forEach(button => {
        input = new BABYLON.GUI.TouchHolographicButton();
        input.text = button.name;
        inut.onPointerDownObservable.add(() => { target.material.diffuseColor = button.color });
        menu.addButton(input);
    })
}

createScene().then(sceneToRender => {
    engine.runRenderLoop(() => sceneToRender.render());
});
