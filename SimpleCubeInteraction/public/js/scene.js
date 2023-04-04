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

    const box = BABYLON.MeshBuilder.CreateBox("box", {});
    box.position.x = 0.5;
    box.position.y = 1;
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
            
    /*for a non-immersive content
    return scene; 
            
    const sceneToRender = createScene();
    engine.runRenderLoop(function(){//function to render the scene, repeatedly on every frame
        sceneToRender.render();
    });*/


    //from this point start the immersive experience programming
    const ground = BABYLON.MeshBuilder.CreateGround("ground", {width:4, height: 4});//create a simple 4x4-meter floor

    //To add a WebXR support, we need to call createDefaultXRExperienceAsync, has a promise result
    const xrPromise = scene.createDefaultXRExperienceAsync({
        floorMeshes: [ground]
    });

    return xrPromise.then((xrExperience) => {
        console.log("Done, WebXR is enabled.");
        return scene;
    });       
};

createScene().then(sceneToRender => {
    engine.runRenderLoop(() => sceneToRender.render());
});
