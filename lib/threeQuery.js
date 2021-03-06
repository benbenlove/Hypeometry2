var threeQuery = function() {
	var that=this;
	this.global = {};
	this.global.camera;
	this.global.world;
	this.global.canvasDom;
	this.global.canvasContainerDom = document.body;
	this.global.renderer;
	this.global.vrEffect;

	this.getWorldWidth = function() {
		return this.global.canvasContainerDom == document.body ? window.innerWidth : this.global.canvasContainerDom.offsetWidth;
	};

	this.getWorldHeight = function() {
		return this.global.canvasContainerDom == document.body ? window.innerHeight : this.global.canvasContainerDom.offsetHeight;
	};

	this.rightButtonEvent = function(func) {
		this.global.canvasContainerDom.oncontextmenu = function(e) {
			if(func) {
				func(e);
			}
			e.preventDefault();
		};
	};

	this.resize = function() {
		var width = this.getWorldWidth();
		var height = this.getWorldHeight();
		if(this.global.camera.type == "PerspectiveCamera") {
			this.global.camera.aspect = width / height;
			this.global.camera.updateProjectionMatrix();
		} else {
			this.global.camera.left = -width / 2;
			this.global.camera.right = width / 2;
			this.global.camera.top = height / 2;
			this.global.camera.bottom = -height / 2;
			this.global.camera.updateProjectionMatrix();
		}
		this.global.renderer.setSize(width, height);
		if($$.global.settings.vr && $$.global.vrEffect) {
			this.global.vrEffect.setSize(width, height);
		}
	};
	//设置最基本的css
	this.setCommonCSS = function() {
		document.write("<style>*{margin:0;padding:0} body{overflow:hidden}</style>");
	};

	this.createWorld = function(options) {
		var world = new THREE.Scene();
		if(!this.global.world) {
			this.global.world = world;
		}
		this.rayCasterEventReceivers=this.global.world.children;
		return world;
	};

	this.createFog = function(option, world) {
		option = option || {
			color: 0xffffff,
			concentration: 0.01
		};
		var scene = world || this.global.world;
		scene.fog = new THREE.FogExp2(option.color || 0, option.concentration || 0);
		return scene.fog;
	};

	this.createRenderer = function(options) {
		options = this.extends({}, [this.global.settings.render, options]);
		var renderer = new THREE.WebGLRenderer(options);
		renderer.setPixelRatio( window.devicePixelRatio );
		renderer.setSize(this.getWorldWidth(), this.getWorldHeight());
		if(!this.global.renderer) {
			this.global.renderer = renderer;
			this.global.canvasContainerDom.appendChild(this.global.renderer.domElement);
			if($$.global.settings.vr) {
				this.global.vrEffect = new THREE.StereoEffect(this.global.renderer);
			}
			this.global.canvasDom = this.global.renderer.domElement;
		}

		return renderer;
	};
	this.createCamera = function(options) {
		var camera;
		var options = this.extends({}, [this.global.settings.camera, options]);
		if(options.type != "OrthographicCamera") {
			camera = new THREE.PerspectiveCamera(options.fov, options.aspect, options.near, options.far);
		} else {
			camera = new THREE.OrthographicCamera(options.left, options.right, options.top, options.bottom, options.near, options.far);
		}
		if(!this.global.camera) {
			this.global.camera = camera;
		}
		return camera;
	};

	this.init = function(worldOpt, renderOpt, cameraOpt) {
		this.setCommonCSS();
		this.createWorld(worldOpt);
		this.createRenderer(renderOpt);
		this.createCamera(cameraOpt);
		this.addEventListener();
		return [this.global.world, this.global.renderer, this.global.camera];
	};
	//添加鼠标事件
	this.addEventListener = function() {
		//鼠标移动事件
		function onDocumentMouseMove(event) {
			event.preventDefault();
			$$.global.mouse.x = (event.clientX / $$.getWorldWidth()) * 2 - 1;
			$$.global.mouse.y = -(event.clientY / $$.getWorldHeight()) * 2 + 1;
			if($$.global.selectedObj && $$.global.selectedObj.object.onDrag && $$.global.isDown) {
				$$.global.selectedObj.object.onDrag($$.global.selectedObj);
			}
		}

		function onDocumentMouseClick(event) {
			if($$.global.selectedObj && $$.global.selectedObj.object.onClick && $$.global.selectedObj.object.isDown == true) {
				$$.global.selectedObj.object.isDown = false;
				$$.global.selectedObj.object.onClick($$.global.selectedObj, event);
			}
			if($$.global.centerSelectedObj && $$.global.centerSelectedObj.object.onCenterClick && $$.global.centerSelectedObj.object.isCenterDown == true) {
				$$.global.centerSelectedObj.object.isCenterDown = false;
				$$.global.centerSelectedObj.object.onCenterClick($$.global.centerSelectedObj, event);
			}
		}

		function onMouseDownOrTouchStart(event) {
			if(event.type == "touchstart") {
				$$.global.mouse.x = (event.targetTouches[0].clientX / $$.getWorldWidth()) * 2 - 1;
				$$.global.mouse.y = -(event.targetTouches[0].clientY / $$.getWorldHeight()) * 2 + 1;
				updateMouseRaycaster(true);
			}

			$$.global.isDown = true;
			if($$.global.selectedObj && $$.global.selectedObj.object) {
				$$.global.selectedObj.object.isDown = true;
			}
			if($$.global.selectedObj && $$.global.selectedObj.object.onDown) {
				$$.global.selectedObj.object.onDown($$.global.selectedObj, event);
			}

			$$.global.isCenterDown = true;
			if($$.global.centerSelectedObj && $$.global.centerSelectedObj.object) {
				$$.global.centerSelectedObj.object.isCenterDown = true;
			}
			if($$.global.centerSelectedObj && $$.global.centerSelectedObj.object.onCenterDown) {
				$$.global.centerSelectedObj.object.onCenterDown($$.global.centerSelectedObj, event);
			}
		}

		function onMouseUpOrTouchEnd(event) {
			$$.global.isDown = false;
			if($$.global.selectedObj && $$.global.selectedObj.object.onUp && $$.global.selectedObj.object.isDown == true) {
				$$.global.selectedObj.object.onUp($$.global.selectedObj, event);
			}

			$$.global.isCenterDown = false;
			if($$.global.centerSelectedObj && $$.global.centerSelectedObj.object.onCenterUp && $$.global.centerSelectedObj.object.isCenterDown == true) {
				$$.global.centerSelectedObj.object.onCenterUp($$.global.centerSelectedObj, event);
			}
		}
		$$.global.canvasContainerDom.addEventListener("click", onDocumentMouseClick);
		$$.global.canvasContainerDom.addEventListener("mousemove", onDocumentMouseMove);
		$$.global.canvasContainerDom.addEventListener("mousedown", onMouseDownOrTouchStart);
		$$.global.canvasContainerDom.addEventListener("mouseup", onMouseUpOrTouchEnd);
		$$.global.canvasContainerDom.addEventListener("touchstart", onMouseDownOrTouchStart);
		$$.global.canvasContainerDom.addEventListener("touchend", onMouseUpOrTouchEnd);
	};

	this.sceneCoordinateToCanvasCoordinate = function(obj, world) {
		var worldVector = obj.position.clone();
		if(world) {
			var vector = worldVector.project(world.camera);
		} else {
			var vector = worldVector.project($$.global.camera);
		}

		var halfWidth = $$.getWorldWidth() / 2;
		var halfHeight = $$.getWorldHeight() / 2;

		var result = {
			x: Math.round(vector.x * halfWidth + halfWidth),
			y: Math.round(-vector.y * halfHeight + halfHeight)
		};
		return result;
	};
	
	window.addEventListener("resize",function(){
		if($$.global.settings.resize) {
			$$.resize();
		}
	},false);

	this.animate = function() {
		requestAnimationFrame($$.animate);
		if($$.global.settings.renderPause) {
			return;
		}
		$$.worldActions();
		for(var i in $$.actionInjections) {
			if($$.actionInjections[i] instanceof Function == true) {
				$$.actionInjections[i]();
			}
		}
		if($$.global.settings.raycaster) {
			updateRaycaster();
		}
		if($$.global.settings.vr) {
			if(!$$.global.vrEffect) {
				$$.global.vrEffect = new THREE.StereoEffect($$.global.renderer);
			}
			$$.global.renderer.render($$.global.world, $$.global.camera);
			$$.global.vrEffect.render($$.global.world, $$.global.camera);
		} else {
			$$.global.renderer.render($$.global.world, $$.global.camera);
		}
		if($$.global.controls) {
			$$.global.controls.update();
		}
	};
	this.actionInjections = [];
	this.worldActions = function() {};

	this.extends = function(des, src, over) {
		var res = extend(des, src, over);

		function extend(des, src, over) {
			var override = true;
			if(over === false) {
				override = false;
			}
			if(src instanceof Array) {
				for(var i = 0, len = src.length; i < len; i++)
					extend(des, src[i], override);
			}
			for(var i in src) {
				if(override || !(i in des)) {
					des[i] = src[i];
				}
			}
			return des;
		}
		for(var i in src) {
			delete res[i];
		}
		return res;
	};

	this.openFullScreen = function() {
		var container = $$.global.canvasContainerDom;
		$$.global.settings.isFullScreem = true;
		if(container.requestFullscreen) {
			container.requestFullscreen();
		} else if(container.msRequestFullscreen) {
			container.msRequestFullscreen();
		} else if(container.mozRequestFullScreen) {
			container.mozRequestFullScreen();
		} else if(container.webkitRequestFullscreen) {
			container.webkitRequestFullscreen();
		} else {
			$$.global.settings.isFullScreem = false;
		}
		return $$.global.settings.isFullScreem;
	};
	this.closeFullScreen = function() {
		var container = document;
		$$.global.settings.isFullScreem = false;
		if(container.exitFullscreen) {
			container.exitFullscreen();
		} else if(container.mozCancelFullScreen) {
			container.mozCancelFullScreen();
		} else if(container.webkitExitFullScreen) {
			container.webkitExitFullScreen();
		} else if(container.msExitFullscreen) {
			container.msExitFullscreen();
		} else if(container.webkitCancelFullScreen) {
			container.webkitCancelFullScreen();
		}
		if(container.webkitExitFullScreen) {
			container.webkitCancelFullScreen();
		}
		return $$.global.settings.isFullScreem;
	};
	this.toggleFullScreen = function() {
		if($$.global.settings.isFullScreem) {
			this.closeFullScreen();
		} else {
			this.openFullScreen();
		}
	};

	this.groups = {}; //添加小组，可以把不同的物体放在不同的组里。并且后续的性能优化，操作方式都会用到group。但是这个group只是把里面的物体进行分类，不进行其他任何操作
	//传入一个group的名称,每个名称的group都是个单例
	this.createGroup = function(str) {
		if($$.groups[str]) {
			return $$.groups[str];
		}
		var g = new $$.ThreeGroup(str);
		$$.groups[str] = g;
		return g;
	};

	this.removeGroup = function(str) {
		if($$.groups[str]) {
			var arr = $$.groups[str].children;
			delete $$.groups[str];
			return arr;
		}
		return [];
	};
	this.global.mouse = new THREE.Vector2();
	this.global.mouse.x = NaN;
	this.global.mouse.y = NaN;
	this.global.raycaster = new THREE.Raycaster();
	this.global.centerRaycaster = new THREE.Raycaster();

	this.global.selectedObj = null;
	this.global.centerSelectedObj = null;

	this.rayCasterEventReceivers = [];

	function updateMouseRaycaster(isTouch) {
		$$.global.raycaster.setFromCamera($$.global.mouse, $$.global.camera);
		var intersects = $$.global.raycaster.intersectObjects($$.rayCasterEventReceivers, true);

		var intersect;
		for(var i = 0; i < intersects.length; i++) {
			if(intersects[i].object.isPenetrated) {
				continue;
			} else {
				intersect = intersects[i];
				break;
			}
		}

		if(intersect) {
			if(($$.global.selectedObj == null) || ($$.global.selectedObj.object.uuid != intersect.object.uuid)) {
				if($$.global.selectedObj && $$.global.selectedObj.object.uuid != intersect.object.uuid && !isTouch) {
					if($$.global.selectedObj.object.onLeave) {
						$$.global.selectedObj.object.onLeave($$.global.selectedObj);
					}
				}
				$$.global.selectedObj = intersect;
				if($$.global.selectedObj.object.onEnter && !isTouch) {
					$$.global.selectedObj.object.onEnter($$.global.selectedObj);
				}
			} else {
				$$.global.selectedObj = intersect;
			}
		} else {
			if($$.global.selectedObj) {
				if($$.global.selectedObj.object.onLeave) {
					$$.global.selectedObj.object.onLeave($$.global.selectedObj);
				}
				$$.global.selectedObj = null;
			}
		}
	}

	function updateCenterRaycaster() {
		var centerV = new THREE.Vector2(0, 0);
		$$.global.centerRaycaster.setFromCamera(centerV, $$.global.camera);
		var intersects = $$.global.centerRaycaster.intersectObjects($$.rayCasterEventReceivers);
		var intersect;
		for(var i = 0; i < intersects.length; i++) {
			if(intersects[i].object.isPenetrated) {
				continue;
			} else {
				intersect = intersects[i];
				break;
			}
		}
		if(intersect) {
			if(($$.global.centerSelectedObj == null) || ($$.global.centerSelectedObj.object.uuid != intersect.object.uuid)) {
				if($$.global.centerSelectedObj && $$.global.centerSelectedObj.object.uuid != intersect.object.uuid) {
					if($$.global.centerSelectedObj.object.onCenterLeave) {
						$$.global.centerSelectedObj.object.onCenterLeave($$.global.centerSelectedObj);
					}
				}
				$$.global.centerSelectedObj = intersect;
				if($$.global.centerSelectedObj.object.onCenterEnter) {
					$$.global.centerSelectedObj.object.onCenterEnter($$.global.centerSelectedObj);
				}
			} else {
				$$.global.centerSelectedObj = intersect;
			}
		} else {
			if($$.global.centerSelectedObj) {
				if($$.global.centerSelectedObj.object.onCenterLeave) {
					$$.global.centerSelectedObj.object.onCenterLeave($$.global.centerSelectedObj);
				}
				$$.global.centerSelectedObj = null;
			}
		}
	}

	function updateRaycaster() {
		updateMouseRaycaster();
		updateCenterRaycaster();
	}

	this.ThreeGroup = function(str) {
		this.name = str;
		this.children = [];
		this.remove = function(obj) {
			for(var i in this.children) {
				if(obj == this.children[i]) {
					this.splice(i, 1);
					return;
				}
			}
		};
		this.push = function(obj) {
			for(var i in this.children) {
				if(obj == this.children[i]) {
					return i;
				}
			}
			this.children.push(obj);
			return i;
		};
	};
	this.get = function(str, group) {
		var key = str.split('=');
		var val = key[1];
		key = key[0];
		var arr = null,
			res = [];
		if(group) {
			if(typeof group == "string") {
				arr = $$.groups[group];
				if(arr) {

				} else {
					return [];
				}
			} else if(typeof group == "object") {
				arr = group.children;
			}
		} else {
			arr = $$.global.world.children;
		}
		if(arr) {
			if(key == "id") {
				for(var i = 0; i < arr.length; i++) {
					if(arr[i].id == val) {
						return arr[i];
					}
				}
			} else {
				for(var i = 0; i < arr.length; i++) {
					if(arr[i][key] == val) {
						res.push(arr[i]);
					}
				}
				return res;
			}
		}
		return [];
	};

	this.subWorlds = {
		children: {},
		getCurrentSubWorld: function() {
			for(var i in $$.subWorlds.children) {
				if($$.subWorlds.children[i].isCurrent) {
					return $$.subWorlds.children[i];
				}
			}
		},
		getSubWorldByName: function(name) {
			for(var i in $$.subWorlds.children) {
				if($$.subWorlds.children[i].name == name) {
					return $$.subWorlds.children[i];
				}
			}
		}
	};

	this.SubWorld = function(optWorld, optCamera) {
		this.name = optWorld.name || "";
		this.id = $$.rndString(16);
		this.scene = new THREE.Scene();
		this.camera = "";
		this.rayCasterEventReceivers = this.scene.children;
		var options = $$.extends({}, [$$.global.settings.camera, optCamera]);
		if(options.type != "OrthographicCamera") {
			this.camera = new THREE.PerspectiveCamera(options.fov, options.aspect, options.near, options.far);
		} else {
			this.camera = new THREE.OrthographicCamera(options.left, options.right, options.top, options.bottom, options.near, options.far);
		}
		this.actionInjections = [];
		renderTargetParameters = {
			minFilter: THREE.LinearFilter,
			magFilter: THREE.LinearFilter,
			format: THREE.RGBFormat,
			stencilBuffer: false
		};
		this.clearColor = optWorld.clearColor;
		this.alpha = optWorld.alpha == null ? 1 : optWorld.alpha;
		this.fbo = new THREE.WebGLRenderTarget($$.getWorldWidth(), $$.getWorldHeight(), renderTargetParameters);
		this.isResize = optWorld.resize == null ? true : optWorld.resize;
		this.resize = function() {
			var width = $$.getWorldWidth();
			var height = $$.getWorldHeight();
			if(this.camera.type == "PerspectiveCamera") {
				this.camera.aspect = width / height;
				this.camera.updateProjectionMatrix();
			} else {
				this.camera.left = -width / 2;
				this.camera.right = width / 2;
				this.camera.top = height / 2;
				this.camera.bottom = -height / 2;
				this.camera.updateProjectionMatrix();
			}
			$$.global.renderer.setSize(width, height);
			if($$.global.settings.vr && $$.global.vrEffect) {
				$$.global.vrEffect.setSize(width, height);
			}
		};
		this.update = function(rtt) {
			if(this.isResize) {
				this.resize();
			}
			for(var i = 0; i < this.actionInjections.length; i++) {
				this.actionInjections[i]();
			}
			if(rtt) {
				$$.global.renderer.render(this.scene, this.camera, this.fbo, true);
			} else {
				$$.global.renderer.render(this.scene, this.camera);
			}

		};
		this.isCurrent = false;
		this.toTexture = function() {
			return this.fbo.texture;
		};
		this.toMain = function() {
			$$.global.world = this.scene;
			$$.global.camera = this.camera;
			$$.actionInjections = this.actionInjections;
			$$.global.renderer.setClearColor(this.clearColor, this.alpha);
			$$.global.controls = this.controls;
			$$.rayCasterEventReceivers = this.rayCasterEventReceivers;
			for(var i in $$.subWorlds) {
				if($$.subWorlds[i].isCurrent) {
					$$.subWorlds[i].isCurrent = false;
					if($$.subWorlds[i].controls) {
						$$.subWorlds[i].controls.enabledBefore = $$.subWorlds[i].controls.enabled;
						$$.subWorlds[i].controls.enabled = false;
					}
				}
			}
			this.isCurrent = true;
			if(this.controls) {
				this.controls.enabled = this.controls.enabledBefore;
			}
		};
		$$.subWorlds.children[this.id] = this;
	};

	this.Transition = function(sceneA, option, texture) {
		var makeSubWorld = function(scene, camera, injections, clearColor) {
			var subWorld = {
				scene: scene,
				camera: camera,
				actionInjections: injections
			};
			renderTargetParameters = {
				minFilter: THREE.LinearFilter,
				magFilter: THREE.LinearFilter,
				format: THREE.RGBFormat,
				stencilBuffer: false
			};
			subWorld.fbo = new THREE.WebGLRenderTarget($$.getWorldWidth(), $$.getWorldHeight(), renderTargetParameters);
			subWorld.clearColor = clearColor;
			subWorld.update = function(rtt) {
				if($$.global.settings.resize) {
					var width = $$.getWorldWidth();
					var height = $$.getWorldHeight();
					if(subWorld.camera.type == "PerspectiveCamera") {
						subWorld.camera.aspect = width / height;
						subWorld.camera.updateProjectionMatrix();
					} else {
						subWorld.camera.left = -width / 2;
						subWorld.camera.right = width / 2;
						subWorld.camera.top = height / 2;
						subWorld.camera.bottom = -height / 2;
						subWorld.camera.updateProjectionMatrix();
					}
					$$.global.renderer.setSize(width, height);
				}
				$$.global.renderer.setClearColor(subWorld.clearColor);
				if(rtt)
					$$.global.renderer.render(subWorld.scene, subWorld.camera, subWorld.fbo, true);
				else {
					$$.global.renderer.render(subWorld.scene, subWorld.camera);
				}
			};
			return subWorld;
		};

		var transitionParams = $$.extends({}, [{
			"useTexture": true,
			"transition": 0,
			"transitionSpeed": 10,
			"texture": 5,
			"loopTexture": true,
			"animateTransition": true,
			"textureThreshold": 0.3
		}, option]);
		var sceneB = makeSubWorld($$.global.world, $$.global.camera, $$.actionInjections, $$.global.renderer.getClearColor().clone());

		this.scene = new THREE.Scene();
		this.cameraOrtho = $$.createCamera({
			type: "OrthographicCamera",
			near: -10,
			far: 10
		});
		this.texture = texture;
		this.quadmaterial = new THREE.ShaderMaterial({
			uniforms: {
				tDiffuse1: {
					value: null
				},
				tDiffuse2: {
					value: null
				},
				mixRatio: {
					value: 0.0
				},
				threshold: {
					value: 0.1
				},
				useTexture: {
					value: 1
				},
				tMixTexture: {
					value: this.texture
				}
			},
			vertexShader: [

				"varying vec2 vUv;",

				"void main() {",

				"vUv = vec2( uv.x, uv.y );",
				"gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",

				"}"

			].join("\n"),
			fragmentShader: [
				"uniform float mixRatio;",
				"uniform sampler2D tDiffuse1;",
				"uniform sampler2D tDiffuse2;",
				"uniform sampler2D tMixTexture;",
				"uniform int useTexture;",
				"uniform float threshold;",
				"varying vec2 vUv;",

				"void main() {",

				"vec4 texel1 = texture2D( tDiffuse1, vUv );",
				"vec4 texel2 = texture2D( tDiffuse2, vUv );",

				"if (useTexture==1) {",

				"vec4 transitionTexel = texture2D( tMixTexture, vUv );",
				"float r = mixRatio * (1.0 + threshold * 2.0) - threshold;",
				"float mixf=clamp((transitionTexel.r - r)*(1.0/threshold), 0.0, 1.0);",

				"gl_FragColor = mix( texel1, texel2, mixf );",
				"} else {",

				"gl_FragColor = mix( texel2, texel1, mixRatio );",

				"}",
				"}"

			].join("\n")
		});

		$$.global.world = this.scene;
		$$.global.camera = this.cameraOrtho;

		quadgeometry = new THREE.PlaneBufferGeometry($$.getWorldWidth(), $$.getWorldHeight());

		this.quad = new THREE.Mesh(quadgeometry, this.quadmaterial);
		this.scene.add(this.quad);

		this.sceneA = sceneA;
		this.sceneB = sceneB;

		this.quadmaterial.uniforms.tDiffuse1.value = sceneA.fbo.texture;
		this.quadmaterial.uniforms.tDiffuse2.value = sceneB.fbo.texture;

		this.needChange = false;

		this.setTextureThreshold = function(value) {

			this.quadmaterial.uniforms.threshold.value = value;

		};

		this.useTexture = function(value) {

			this.quadmaterial.uniforms.useTexture.value = value ? 1 : 0;

		};

		this.setTexture = function(i) {

			this.quadmaterial.uniforms.tMixTexture.value = this.texture;

		};

		this.render = function() {
			var owner = arguments.callee.owner;
			if($$.global.settings.resize) {
				var width = $$.getWorldWidth();
				var height = $$.getWorldHeight();
				owner.cameraOrtho.left = -width / 2;
				owner.cameraOrtho.right = width / 2;
				owner.cameraOrtho.top = height / 2;
				owner.cameraOrtho.bottom = -height / 2;
			}

			if(transitionParams.animateTransition) {
				transitionParams.transition += 0.001 * transitionParams.transitionSpeed;
			}
			owner.quadmaterial.uniforms.mixRatio.value = Math.min(transitionParams.transition, 1);
			if(transitionParams.transition === 0) {
				owner.sceneB.update(false);
			} else if(transitionParams.transition >= 1) {
				owner.sceneA.update(true);
				for(var i = 0; i < $$.actionInjections.length; i++) {
					if($$.actionInjections[i] == arguments.callee) {
						$$.actionInjections.splice(i, 1);
					}
				}
				owner.sceneA.toMain();

			} else {
				$$.global.renderer.setClearColor(owner.sceneB.clearColor);
				owner.sceneB.update(true);
				$$.global.renderer.setClearColor(owner.sceneA.clearColor);
				owner.sceneA.update(true);
				$$.global.renderer.render(owner.scene, owner.cameraOrtho, null, true);
			}
		};
		this.render.owner = this;
	};

	this.rndString = function(len) {
		if(len <= 0) {
			return "";
		}
		len = len - 1 || 31;　　
		var $chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';　　
		var maxPos = $chars.length + 1;　　
		var pwd = $chars.charAt(Math.floor(Math.random() * (maxPos - 10)));
		for(i = 0; i < len; i++) {　　　　
			pwd += $chars.charAt(Math.floor(Math.random() * maxPos));　　
		}　　
		return pwd;
	};

	this.rndInt = function(max) {
		return Math.floor(Math.random() * max);
	};

	this.global.settings = {
		camera: {
			type: "PerspectiveCamera", //透视相機
			fov: 90, //视野广角，单位是度数
			aspect: this.getWorldWidth() / this.getWorldHeight(), //拉伸比例
			near: 1,
			far: 10000,
			left: -this.getWorldWidth() / 2, //这4个用于正交相机
			right: this.getWorldWidth() / 2,
			top: this.getWorldHeight() / 2,
			bottom: -this.getWorldHeight() / 2,
		},
		render: {
			alpha: false,
			antialias: true,
			clearColor: 0x000000,
			depth: true,
			logarithmicDepthBuffer: false,
			precision: "highp",
			premultipliedAlpha: false,
			preserveDrawingBuffer: false,
			stencil: true,
		},
		sea: {
			alpha: 1,
			color: 0x001e0f,
			width: 100000,
			height: 100000
		},
		raycaster: true, //启用射线法
		resize: true, //如果窗口大小改变则改变渲染大小
		renderPause: false, //暂停渲染循环
		vr: false, //显示VR效果,
		showLoadingProgress: false, //显示加载的进度条
		isFullScreem: false
	};
};
var $$ = new threeQuery();
$$.Loader = new (function() {
	var that=this;
	this.RESOURCE = {
		textures: {},
		models: {},
		sounds: {},
		fonts: {},
		unloadedSource: {
			textures: [],
			models: [],
			sounds: [],
			fonts: []
		}
	};
	this.loadingManager = new THREE.LoadingManager();
	this.loadingManager.onProgress = function(item, loaded, total) {
		that.onProgress(item, loaded, total);
		if(loaded == total) {
			allLoaded = true;
			if(allLoaded && soundDecodeNum == 0) {
				if(that.onLoadComplete) {
					that.onLoadComplete();
				}
			}
		}
	};
	this.onProgress = function() {};
	this.onLoadComplete = function() {};
	this.loadTexture = function(arr) {
		allLoaded = false;
		var loader = new THREE.TextureLoader(that.loadingManager);
		for(let i in arr) {
			loader.load(arr[i],
				function(texture) {
					that.RESOURCE.textures[arr[i]] = texture;
				},
				function(xhr) {},
				function(xhr) {
					that.RESOURCE.unloadedSource.textures.push(arr[i]);
					console.log(arr[i] + " is not found");
				}
			);
		}
	};
	this.loadCubeTexture = function(name, arr) {
		allLoaded = false;
		var loader = new THREE.CubeTextureLoader(that.loadingManager);
		loader.load(arr,
			function(texture) {
				that.RESOURCE.textures[name] = texture;
			},
			function(xhr) {},
			function(xhr) {
				that.RESOURCE.unloadedSource.textures.push(arr[i]);
				console.log(name + " is not found");
			}
		);
	};
	var soundDecodeNum = 0; //需要解码的音频数量
	var allLoaded = true;
	this.loadSound = function(arr) {
		var loader = new THREE.AudioLoader(that.loadingManager);
		for(let i in arr) {
			soundDecodeNum++;
			loader.load(arr[i],
				function(buffer) {
					that.RESOURCE.sounds[arr[i]] = buffer;
					soundDecodeNum--;
					if(allLoaded && soundDecodeNum == 0) {
						if($$.onLoadComplete) {
							$$.onLoadComplete();
						}
					}
				},
				function(xhr) {},
				function(xhr) {
					that.RESOURCE.unloadedSource.sounds.push(arr[i]);
					console.log(arr[i] + " is not found");
				}
			);
		}
	};
	this.loadFont = function(arr) {
		allLoaded = false;
		var loader = new THREE.FontLoader(that.loadingManager);
		var loader2 = new THREE.TTFLoader(that.loadingManager);
		for(let i in arr) {
			var str = arr[i];
			if(str.lastIndexOf(".json") == str.length - 5) {
				loader.load(arr[i],
					function(font) {
						that.RESOURCE.fonts[arr[i]] = font;
					},
					function(xhr) {},
					function(xhr) {
						that.RESOURCE.unloadedSource.textures.push(arr[i]);
						console.log(arr[i] + " is not found");
					}
				);
			} else {
				loader2.load(arr[i],
					function(json) {
						var font = new THREE.Font(json);
						that.RESOURCE.fonts[arr[i]] = font;
					},
					function(xhr) {},
					function(xhr) {
						that.RESOURCE.unloadedSource.textures.push(arr[i]);
						console.log(arr[i] + " is not found");
					}
				);
			}
		}
	};
});
//九宫格对齐方式：
//1 2 3
//4 5 6
//7 8 9
$$.Component = {
	drawTextImage: function(str, options) {
		var optionDefault = {
			fontSize: 30,
			fontFamily: "Courier New",
			color: "white",
			textAlign: 5, //九宫格对齐方式，5是居中
			backgroundColor: "red",
			//			backgroundImage:"",
			width: 1,
			height: 1,
			lineHeight: 30,
			x: 0,
			y: 0
		};
		var strArr = str.split("\n");

		var maxLength = 0;
		for(var i in strArr) {
			if(maxLength < strArr[i].length) {
				maxLength = strArr[i].length;
			}
		}
		var optionstmp = $$.extends({}, [optionDefault, options]);

		if(!options.width) {
			while(optionstmp.width < maxLength * optionstmp.fontSize) {
				optionstmp.width *= 2;
			}
		}
		if(!options.height) {
			var tmpheight = strArr.length * optionstmp.lineHeight;
			while(optionstmp.height < tmpheight) {
				optionstmp.height *= 2;
			}
		}

		var canvas = document.createElement("canvas");
		canvas.width = optionstmp.width;
		canvas.height = optionstmp.height;
		var ctx = canvas.getContext("2d");
		ctx.fillStyle = optionstmp.backgroundColor;
		ctx.fillRect(0, 0, optionstmp.width, optionstmp.height);
		ctx.font = optionstmp.fontSize + "px " + optionstmp.fontFamily;
		ctx.fillStyle = optionstmp.color;

		var x = 0,
			y = 0;

		for(var i in strArr) {
			ctx.fillText(strArr[i], optionstmp.x, optionstmp.y + (optionstmp.lineHeight * i + optionstmp.lineHeight));
		}
		return canvas;
	},

	//创建计时器，计时器的总时间，间隔触发事件时间
	Timer: function(options,world) {
		this.actionInjections=world?world.actionInjections:$$.actionInjections;
		var defaultOptions = {
			id: "",
			life: 1000,
			duration: 1000,
			onStart: function() {
				console.log("timer start");
			},
			onRepeat: function() {
				console.log("repeat");
			},
			onEnd: function() {
				console.log("timer end");
			}
		};
		this.options = $$.extends({}, [defaultOptions, options]);
		this.id = options.id;
		this.life = options.life;
		this.duration = options.duration;
		this.onStart = options.onStart || function() {
			console.log("timer start");
		};
		this.onRepeat = options.onRepeat || function() {
			console.log("timer repeat");
		};
		this.onEnd = options.onEnd || function() {
			console.log("timer end");
		};
		this.lastTime;
		this.nowTime;
		this.elapsedTime = 0;
		this.durationTmp = 0;
		this.start = function() {
			this.lastTime = this.nowTime = performance.now();
			this.onStart();
			this.actionInjections.push(this.update);
		};
		let thisObj = this;
		this.update = function() {
			thisObj.lastTime = thisObj.nowTime;
			thisObj.nowTime = performance.now();
			thisObj.elapsedTime = thisObj.nowTime - thisObj.lastTime;
			thisObj.life -= thisObj.elapsedTime;

			if(thisObj.life <= 0) {
				thisObj.onEnd();
				for(var i in thisObj.actionInjections) {
					if(thisObj.update == thisObj.actionInjections[i]) {
						
						thisObj.actionInjections.splice(i, 1);
						break;
					}
				}
				return;
			}
			thisObj.durationTmp += thisObj.elapsedTime;
			if(thisObj.durationTmp >= thisObj.duration) {
				thisObj.durationTmp -= thisObj.duration;
				thisObj.onRepeat();
			}
		};
	},

	//创建子弹，它会直线前进，直到生命周期到了
	createBullet: function(mesh, options) {
		var position = $$.controls.getObject().position;
		var direction = $$.global.centerRaycaster.ray.direction;
		var defOpts = {
			speed: 3,
			life: 10000,
			position: new THREE.Vector3(position.x, position.y, position.z),
			direction: new THREE.Vector3(direction.x, direction.y, direction.z)
		};
		options = $$.extends({}, [defOpts, options]);
		mesh.lookAt(options.direction);
		mesh.position.x = options.position.x;
		mesh.position.y = options.position.y;
		mesh.position.z = options.position.z;
		mesh.lifeStart = new Date().getTime();
		mesh.life = options.life;
		$$.global.world.add(mesh);

		$$.actionInjections.push(function() {
			mesh.position.x += options.direction.x * options.speed;
			mesh.position.y += options.direction.y * options.speed;
			mesh.position.z += options.direction.z * options.speed;
			if(mesh.life <= new Date().getTime() - mesh.lifeStart) {
				$$.global.world.remove(mesh);
				for(var i in $$.actionInjections) {
					if($$.actionInjections[i] == arguments.callee) {
						$$.actionInjections.splice(i, 1);
					}
				}
			}
		});
	},
	createSkydome: function(pic, size, world) {
		var skyGeo = new THREE.SphereGeometry(size || 1000000, 25, 25);
		var texture = $$.Loader.RESOURCE.textures[pic] || (new THREE.TextureLoader).load(pic);
		var material = new THREE.MeshBasicMaterial({
			map: texture,
		});
		var sky = new THREE.Mesh(skyGeo, material);
		sky.material.side = THREE.BackSide;
		if(world) {
			world.scene.add(sky);
		} else {
			$$.global.world.add(sky);
		}

		return sky;
	},
	createSkybox: function(texture, width, world) {
		var cubeMap = new THREE.CubeTexture([]);
		cubeMap.format = THREE.RGBFormat;

		var loader = new THREE.ImageLoader();
		loader.load(texture, function(image) {
			var getSide = function(x, y) {

				var size = 1024;

				var canvas = document.createElement('canvas');
				canvas.width = size;
				canvas.height = size;

				var context = canvas.getContext('2d');
				context.drawImage(image, -x * size, -y * size);
				return canvas;
			};

			cubeMap.images[0] = getSide(2, 1); // px
			cubeMap.images[1] = getSide(0, 1); // nx
			cubeMap.images[2] = getSide(1, 0); // py
			cubeMap.images[3] = getSide(1, 2); // ny
			cubeMap.images[4] = getSide(1, 1); // pz
			cubeMap.images[5] = getSide(3, 1); // nz
			cubeMap.needsUpdate = true;

		});

		var cubeShader = THREE.ShaderLib.cube;
		cubeShader.uniforms.tCube.value = cubeMap;
		var skyBoxMaterial = new THREE.ShaderMaterial({
			fragmentShader: cubeShader.fragmentShader,
			vertexShader: cubeShader.vertexShader,
			uniforms: cubeShader.uniforms,
			depthWrite: false,
			side: THREE.BackSide
		});

		var skyBox = new THREE.Mesh(
			new THREE.BoxGeometry(width || 1000000, width || 1000000, width || 1000000),
			skyBoxMaterial
		);

		if(world) {
			world.scene.add(skyBox);
		} else {
			$$.global.world.add(skyBox);
		}
		return skyBox;
	},
	createSea: function(options, world) {
		world = world || {
			scene: $$.global.world,
			camera: $$.global.camera,
			renderer: $$.global.renderer
		};
		options = $$.extends({}, [$$.global.settings.sea, options]);
		if($$.Loader.RESOURCE.textures[options.texture]) {
			waterNormals = $$.Loader.RESOURCE.textures[options.texture];
			waterNormals.wrapS = waterNormals.wrapT = THREE.RepeatWrapping;
			water = new THREE.Water($$.global.renderer, world.camera, world.scene, {
				textureWidth: waterNormals.image.width,
				textureHeight: waterNormals.image.height,
				waterNormals: waterNormals,
				alpha: options.alpha,
				waterColor: options.color,
			});

			mirrorMesh = new THREE.Mesh(
				new THREE.PlaneBufferGeometry(options.width, options.height),
				water.material
			);

			mirrorMesh.add(water);
			mirrorMesh.rotation.x = -Math.PI * 0.5;
			world.scene.add(mirrorMesh);
			water.waterMesh = mirrorMesh;
			if(world.actionInjections) {
				world.actionInjections.push(function() {
					water.material.uniforms.time.value += 1.0 / 60.0;
					water.render();
				});
			} else {
				$$.actionInjections.push(function() {
					water.material.uniforms.time.value += 1.0 / 60.0;
					water.render();
				});
			}
			return water;
		} else {
			var loader = new THREE.TextureLoader();
			loader.load(options.texture,
				function(texture) {
					$$.Loader.RESOURCE.textures[options.texture] = texture;
					waterNormals = texture;
					waterNormals.wrapS = waterNormals.wrapT = THREE.RepeatWrapping;
					water = new THREE.Water($$.global.renderer, world.camera, world.scene, {
						textureWidth: waterNormals.image.width,
						textureHeight: waterNormals.image.height,
						waterNormals: waterNormals,
						alpha: options.alpha,
						waterColor: options.color,
					});

					mirrorMesh = new THREE.Mesh(
						new THREE.PlaneBufferGeometry(options.width, options.height),
						water.material
					);

					mirrorMesh.add(water);
					mirrorMesh.rotation.x = -Math.PI * 0.5;
					world.scene.add(mirrorMesh);
					water.waterMesh = mirrorMesh;
					if(world.actionInjections) {
						world.actionInjections.push(function() {
							water.material.uniforms.time.value += 1.0 / 60.0;
							water.render();
						});
					} else {
						$$.actionInjections.push(function() {
							water.material.uniforms.time.value += 1.0 / 60.0;
							water.render();
						});
					}

					return water;
				},
				function(xhr) {},
				function(xhr) {
					$$.Loader.RESOURCE.unloadedSource.textures.push(arr[i]);
					console.log(arr[i] + " is not found");
				}
			);
		}
	}
};
$$.Controls = {
	createOrbitControls: function(options,world) {
		options=options?options:{};
		options=$$.extends({},[{
			noZoom:true,
			noPan:true,
			rotateUp:0,
			minDistance:0,
			maxDistance:Infinity,
			zoomSpeed : 1.0,
			noRotate : false,
  			rotateSpeed : 1.0,
  			keyPanSpeed:7.0,
  			autoRotate : false,
  			autoRotateSpeed :2.0,
  			minPolarAngle : 0,
  			maxPolarAngle : Math.PI,
		},options]);
		var camera = world?world.camera:$$.global.camera;
		var element = $$.global.canvasDom;
		var controls = new THREE.OrbitControls(camera, element);
		controls.rotateUp(options.rotateUp);
		controls.target.set(
			camera.position.x + 0.1,
			camera.position.y,
			camera.position.z
		);
		controls.noZoom = options.noZoom;
		controls.noPan = options.noPan;
		controls.minDistance=options.minDistance;
		controls.maxDistance=options.maxDistance;
		controls.zoomSpeed=options.zoomSpeed;
		controls.noRotate=options.noRotate;
		controls.rotateSpeed=options.rotateSpeed;
		controls.keyPanSpeed=options.keyPanSpeed;
		controls.autoRotate=options.autoRotate;
		controls.autoRotateSpeed=options.autoRotateSpeed;
		controls.minPolarAngle=options.minPolarAngle;
		controls.maxPolarAngle=options.maxPolarAngle;
		if(world) {
			world.controls = controls;
			world.controls.enabledBefore=controls.enabled;
		} else {
			$$.global.controls = controls;
		}
		return controls;
	},
	createTrackBallControls: function(options, world) {
		if(!options) {
			options = {};
		}
		var camera = world ? world.camera : $$.global.camera;
		//		var scene = $$.global.world;
		controls = new THREE.TrackballControls(camera);
		controls.rotateSpeed = options.rotateSpeed || 1;
		controls.minDistance = options.minDistance || 1000;
		controls.maxDistance = options.maxDistance || 1000;
		controls.zoomSpeed = options.zoomSpeed || 1;
		controls.panSpeed = options.panSpeed || 1;
		controls.noZoom = options.noZoom || false;
		controls.noPan = options.noPan || false;
		controls.enabled = options.enabled == null ? true : options.enabled;
		controls.dynamicDampingFactor = options.dynamicDampingFactor || 0.3;
		controls.staticMoving = options.staticMoving || false;
		if(world) {
			world.controls = controls;
			world.controls.enabledBefore=controls.enabled;
		} else {
			$$.global.controls = controls;
		}

		return controls;
	},
	createDeviceOrientationControls: function() {
		var controls = new THREE.DeviceOrientationControls($$.global.camera, true);
		controls.connect();
		controls.update();
		//window.removeEventListener('deviceorientation', $$.Controls.createDeviceOrientationControls, true);
		//window.addEventListener('deviceorientation', $$.Controls.createDeviceOrientationControls, true);
		$$.global.controls = controls;
		return controls;
	},
	createPointerLockControls: function() {
		var controls = new THREE.PointerLockControls($$.global.camera);
		$$.global.controls = controls;
		scene.add(controls.getObject());
		controls.controlsEnabled = true;
		controls.enabled = true;
		controls.update = function() {

		};
		return controls;
	},
	createFirstCharacterControls: function(options, blocker) {
		if(options){
			if(options.speed){
				options.speed.x=options.speed.x!=null?options.speed.x:1;
				options.speed.z=options.speed.z!=null?options.speed.z:1;
				options.speed.y=options.speed.y!=null?options.speed.y:200;
			}else{
				options.speed=new THREE.Vector3(100,200,100);
			}
			options.gravity=options.gravity!=null?options.gravity:10;
			options.tall=options.tall!=null?options.tall:10;
			if(options.acceleration){
				options.acceleration.x=options.acceleration.x!=null?options.acceleration.x:1;
				options.acceleration.z=options.acceleration.z!=null?options.acceleration.z:1;
			}else{
				options.acceleration=new THREE.Vector3(1,0,1);
			}
		}
		
		var controls = new THREE.PointerLockControls($$.global.camera);
		$$.global.controls = controls;
		scene.add(controls.getObject());

		var havePointerLock = 'pointerLockElement' in document || 'mozPointerLockElement' in document || 'webkitPointerLockElement' in document;
		if(havePointerLock) {
			var element = document.body;
			var pointerlockchange = function(event) {
				if(document.pointerLockElement === element || document.mozPointerLockElement === element || document.webkitPointerLockElement === element) {
					controls.controlsEnabled = true;
					controls.enabled = true;
					blocker.style.display = 'none';
				} else {
					controls.enabled = false;
					blocker.style.display = '-webkit-box';
					blocker.style.display = '-moz-box';
					blocker.style.display = 'box';
				}
			};
			var pointerlockerror = function(event) {
				blocker.style.display = '-webkit-box';
				blocker.style.display = '-moz-box';
				blocker.style.display = 'box';
			};
			// Hook pointer lock state change events
			document.addEventListener('pointerlockchange', pointerlockchange, false);
			document.addEventListener('mozpointerlockchange', pointerlockchange, false);
			document.addEventListener('webkitpointerlockchange', pointerlockchange, false);
			document.addEventListener('pointerlockerror', pointerlockerror, false);
			document.addEventListener('mozpointerlockerror', pointerlockerror, false);
			document.addEventListener('webkitpointerlockerror', pointerlockerror, false);
			blocker.addEventListener('click', function(event) {
				blocker.style.display = 'none';
				// Ask the browser to lock the pointer
				element.requestPointerLock = element.requestPointerLock || element.mozRequestPointerLock || element.webkitRequestPointerLock;
				if(/Firefox/i.test(navigator.userAgent)) {
					var fullscreenchange = function(event) {
						if(document.fullscreenElement === element || document.mozFullscreenElement === element || document.mozFullScreenElement === element) {
							document.removeEventListener('fullscreenchange', fullscreenchange);
							document.removeEventListener('mozfullscreenchange', fullscreenchange);
							element.requestPointerLock();
						}
					};
					document.addEventListener('fullscreenchange', fullscreenchange, false);
					document.addEventListener('mozfullscreenchange', fullscreenchange, false);
					element.requestFullscreen = element.requestFullscreen || element.mozRequestFullscreen || element.mozRequestFullScreen || element.webkitRequestFullscreen;
					element.requestFullscreen();
				} else {
					element.requestPointerLock();
				}
			}, false);
		} else {
			blocker.innerHTML = 'Your browser doesn\'t seem to support Pointer Lock API';
		}
		//移动模块
		controls.controlsEnabled = false;
		controls.moveForward = false;
		controls.moveBackward = false;
		controls.moveLeft = false;
		controls.moveRight = false;
		controls.canJump = true;
		controls.prevTime = performance.now();
		controls.velocity = new THREE.Vector3(0,0,0);
		//是否使用键盘控制移动
		if(options && options.keymove) {
			document.addEventListener('keydown', function(event) {
				switch(event.keyCode) {
					case 38: // up
					case 87: // w
						$$.global.controls.moveForward = true;
						break;
					case 37: // left
					case 65: // a
						$$.global.controls.moveLeft = true;
						break;
					case 40: // down
					case 83: // s
						$$.global.controls.moveBackward = true;
						break;
					case 39: // right
					case 68: // d
						$$.global.controls.moveRight = true;
						break;
					case 32: // space
						
						if($$.global.controls.canJump === true){$$.global.controls.velocity.y += options.speed.y};
						$$.global.controls.canJump = false;
						break;
				}
			}, false);
			document.addEventListener('keyup', function(event) {
				switch(event.keyCode) {
					case 38: // up
					case 87: // w
						$$.global.controls.moveForward = false;
						break;
					case 37: // left
					case 65: // a
						$$.global.controls.moveLeft = false;
						break;
					case 40: // down
					case 83: // s
						$$.global.controls.moveBackward = false;
						break;
					case 39: // right
					case 68: // d
						$$.global.controls.moveRight = false;
						break;
				}
			}, false);
		}
		controls.prevTime = performance.now();
		controls.update = function() {
			if($$.global.controls.enabled) {
				$$.global.controls.time = performance.now();
				var delta = ($$.global.controls.time - $$.global.controls.prevTime) / 1000;
				$$.global.controls.velocity.x -= $$.global.controls.velocity.x * options.acceleration.x * delta;
				$$.global.controls.velocity.z -= $$.global.controls.velocity.z * options.acceleration.z * delta;
				$$.global.controls.velocity.y -= options.gravity * 100.0 * delta; // 100.0 = mass
				if($$.global.controls.moveForward) $$.global.controls.velocity.z -= options.speed.z * delta;
				if($$.global.controls.moveBackward) $$.global.controls.velocity.z += options.speed.z * delta;
				if($$.global.controls.moveLeft) $$.global.controls.velocity.x -= options.speed.x * delta;
				if($$.global.controls.moveRight) $$.global.controls.velocity.x += options.speed.x * delta;
				$$.global.controls.getObject().translateX($$.global.controls.velocity.x * delta);
				$$.global.controls.getObject().translateY($$.global.controls.velocity.y * delta);
				$$.global.controls.getObject().translateZ($$.global.controls.velocity.z * delta);
				if($$.global.controls.getObject().position.y < options.tall) {
					$$.global.controls.velocity.y = 0;
					$$.global.controls.getObject().position.y = options.tall;
					$$.global.controls.canJump = true;
				}
				$$.global.controls.prevTime = $$.global.controls.time;
			}
		};
		return controls;
	},
};
$$.Move = {
	Linear: function(obj, speedRate, targetPosition) {
		this.obj = obj;
		this.speedRate = speedRate;
		this.targetPosition = targetPosition;

		this.direction = {
			x: this.targetPosition.x - this.obj.position.x,
			y: this.targetPosition.y - this.obj.position.y,
			z: this.targetPosition.z - this.obj.position.z,
		};

		var uvec = $$.unitVector(this.direction);
		this.speed = {
			x: uvec.x * speedRate,
			y: uvec.y * speedRate,
			z: uvec.z * speedRate,
		};

		this.update = function() {
			var owner = arguments.callee.owner;
			owner.direction = {
				x: owner.targetPosition.x - owner.obj.position.x,
				y: owner.targetPosition.y - owner.obj.position.y,
				z: owner.targetPosition.z - owner.obj.position.z,
			};
			var dLen = vecLength(owner.direction);
			if(dLen < owner.speedRate) {
				owner.obj.position.x = owner.targetPosition.x;
				owner.obj.position.y = owner.targetPosition.y;
				owner.obj.position.z = owner.targetPosition.z;
				owner.destroy();
			} else {
				owner.obj.position.x += owner.speed.x;
				owner.obj.position.y += owner.speed.y;
				owner.obj.position.z += owner.speed.z;
			}
		};
		this.update.owner = this;
		this.destroy = function() {
			for(var i = 0; i < $$.actionInjections.length; i++) {

				if($$.actionInjections[i] == this.update) {
					$$.actionInjections.splice(i, 1);
					break;
				}
			}
		};
	},
	Surround: function(mother, child, speedRate, vVect) {
		this.angle = 0;
		this.speedRate = speedRate;
		this.mother = mother;
		this.child = child;
		this.vVect = vVect;
		this.radius = $$.vecLength({
			x: this.child.position.x - this.mother.position.x,
			y: this.child.position.y - this.mother.position.y,
			z: this.child.position.z - this.mother.position.z
		});
		this.update = function() {
			var childToMotherVec = {
				x: this.child.position.x - this.mother.position.x,
				y: this.child.position.y - this.mother.position.y,
				z: this.child.position.z - this.mother.position.z
			};
			var modVec1 = $$.vecLength(childToMotherVec);
			childToMotherVec.x = childToMotherVec.x * this.radius / modVec1;
			childToMotherVec.y = childToMotherVec.y * this.radius / modVec1;
			childToMotherVec.z = childToMotherVec.z * this.radius / modVec1;

			var speedVec = $$.crossMulti(childToMotherVec, vVect);
			var modSpeedVec = $$.vecLength(speedVec);
			speedVec.x = speedVec.x * speedRate / modSpeedVec;
			speedVec.y = speedVec.y * speedRate / modSpeedVec;
			speedVec.z = speedVec.z * speedRate / modSpeedVec;

			child.position.x += speedVec.x;
			child.position.y += speedVec.y;
			child.position.z += speedVec.z;

			var vec2 = {
				x: this.child.position.x - this.mother.position.x,
				y: this.child.position.y - this.mother.position.y,
				z: this.child.position.z - this.mother.position.z
			};

			var modVec2 = $$.vecLength(vec2);
			vec2.x = vec2.x * this.radius / modVec2;
			vec2.y = vec2.y * this.radius / modVec2;
			vec2.z = vec2.z * this.radius / modVec2;
			this.child.position.x = this.mother.position.x + vec2.x;
			this.child.position.y = this.mother.position.y + vec2.y;
			this.child.position.z = this.mother.position.z + vec2.z;
		};
		this.destroy = function() {
			for(var i = 0; i < $$.actionInjections.length; i++) {
				if($$.actionInjections[i] == this.update) {
					$$.actionInjections.splice(i, 1);
					break;
				}
			}
		};
	},
	RelateToCamera:function(obj,isFaceToCamera,world){
		if(!world){
			this.camera=$$.global.camera;
		}else{
			this.camera=world.camera;
		}
		this.obj=obj;
		this.isFaceToCamera=isFaceToCamera;
		this.absVec={
			x:obj.position.x-this.camera.position.x,
			y:obj.position.y-this.camera.position.y,
			z:obj.position.z-this.camera.position.z
		};
		console.log(this.absVec);
		this.update=function(){
			var owner=arguments.callee.owner;
			owner.obj.position.x=owner.camera.position.x+owner.absVec.x;
			owner.obj.position.y=owner.camera.position.y+owner.absVec.y;
			owner.obj.position.z=owner.camera.position.z+owner.absVec.z;
			if(isFaceToCamera){
				owner.obj.lookAt(owner.camera.position);
			}
		};
		this.update.owner=this;
		this.destroy = function() {
			for(var i = 0; i < $$.actionInjections.length; i++) {
				if($$.actionInjections[i] == this.update) {
					$$.actionInjections.splice(i, 1);
					break;
				}
			}
		};
	}
};

$$.crossMulti = function(vec1, vec2) {
	var res = {
		x: 0,
		y: 0,
		z: 0
	};
	res.x = vec1.y * vec2.z - vec2.y * vec1.z;
	res.y = vec1.z * vec2.x - vec2.z * vec1.x;
	res.z = vec1.x * vec2.y - vec2.x * vec1.y;
	return res;
};

$$.vecLength = function(vec) {
	return Math.sqrt(vec.x * vec.x + vec.y * vec.y + vec.z * vec.z);
};

$$.unitVector = function(vec) {
	var len = $$.vecLength(vec);
	vec.x /= len;
	vec.y /= len;
	vec.z /= len;
	return vec;
};
$$.Weather = {
	Snow: function(options, texture) {
		options = $$.extends({}, [{
			startSpeed: 2,
			endSpeed: 10,
			duration: 50,
			amount: 2000,
			startAmount: 500,
			fallSpeed: 2,
			scale: [10, 20],
			wind: {
				x: 0,
				y: 0,
				z: 0
			},
			area: {
				x: [-2000, 2000],
				y: [-2000, 2000],
				z: [-2000, 2000],
			},
			swing: {
				x: 2,
				y: 0,
				z: 2
			}
		}, options]);
		this.amount = options.amount;
		this.startAmount = options.startAmount;
		this.fallSpeed = options.fallSpeed;
		this.scale = options.scale;
		this.wind = options.wind;
		this.swing = options.swing;
		this.startSpeed = options.startSpeed;
		this.endSpeed = options.endSpeed;
		this.duration = options.duration;
		this.particles = [];
		this.material = new THREE.SpriteMaterial({
			map: texture,
			color: 0xffffff
		});
		this.onStartEnd = function() {
			console.log("snow start end");
		};
		this.onEndEnd = function() {
			console.log("snow end end");
		};
		this.area = options.area;

		function randomRange(min, max) {
			return((Math.random() * (max - min)) + min);
		}

		function rndInt(n) {
			return Math.floor(Math.random() * n);
		}

		for(i = 0; i < this.startAmount; i++) {
			var particle = new THREE.Sprite(this.material);
			var randomScale = randomRange(this.scale[0], this.scale[1]);
			particle.position.x = randomRange(this.area.x[0], this.area.x[1]);
			particle.position.y = randomRange(this.area.y[0], this.area.y[1]);
			particle.position.z = randomRange(this.area.z[0], this.area.z[1]);
			particle.scale.x = particle.scale.y = particle.scale.z = randomScale;
			particle.v = new THREE.Vector3(0, this.wind.y - this.fallSpeed + randomRange(-this.swing.y, this.swing.y), 0);
			particle.v.z = (this.wind.z + randomRange(-this.swing.z, this.swing.z));
			particle.v.x = (this.wind.x + randomRange(-this.swing.x, this.swing.x));

			this.particles.push(particle);
			$$.global.world.add(particle);
		}

		this.start = function() {
			var timer = new $$.Component.Timer({
				life: (this.amount - this.startAmount) / this.startSpeed * this.duration,
				duration: this.duration,
				onRepeat: function() {
					for(var i = 0; i < this.owner.startSpeed; i++) {
						if(this.owner.particles.length >= this.owner.amount) {
							break;
						}
						var particle = new THREE.Sprite(this.owner.material);
						var randomScale = randomRange(this.owner.scale[0], this.owner.scale[1]);
						particle.position.x = randomRange(this.owner.area.x[0], this.owner.area.x[1]);
						particle.position.y = this.owner.area.y[1];
						particle.position.z = randomRange(this.owner.area.z[0], this.owner.area.z[1]);
						particle.scale.x = particle.scale.y = particle.scale.z = randomScale;
						particle.v = new THREE.Vector3(0, this.owner.wind.y - this.owner.fallSpeed + randomRange(-this.owner.swing.y, this.owner.swing.y), 0);
						particle.v.z = (this.owner.wind.z + randomRange(-this.owner.swing.z, this.owner.swing.z));
						particle.v.x = (this.owner.wind.x + randomRange(-this.owner.swing.x, this.owner.swing.x));

						this.owner.particles.push(particle);
						$$.global.world.add(particle);
					}
				},
				onEnd: this.onStartEnd
			});
			timer.owner = this;
			timer.start();
			$$.actionInjections.push(this.update);
		};

		this.end = function() {
			var timer = new $$.Component.Timer({
				life: (this.amount / this.endSpeed + 1) * this.duration,
				duration: this.duration,
				onRepeat: function() {
					for(var i = 0; i < this.owner.endSpeed; i++) {
						if(this.owner.particles.length > 0) {
							var id = rndInt(this.owner.particles.length);
							$$.global.world.remove(this.owner.particles[id]);
							this.owner.particles.splice(id, 1);
						} else {
							break;
						}
					}
				},
				onEnd: function() {
					while(this.owner.particles.length) {
						var id = rndInt(this.owner.particles.length);
						$$.global.world.remove(this.owner.particles[id]);
						this.owner.particles.splice(id, 1);
					}
					onEnd: this.owner.onEndEnd;
				}
			});
			timer.owner = this;
			timer.start();
			$$.actionInjections.push(this.update);
		};

		this.update = function() {
			var owner = arguments.callee.owner;
			for(var i = 0; i < owner.particles.length; i++) {
				var particle = owner.particles[i];
				var pp = particle.position;

				pp.add(particle.v);

				if(pp.y < owner.area.y[0]) pp.y = owner.area.y[1];
				if(pp.x > owner.area.x[1]) pp.x = owner.area.x[0];
				else if(pp.x < owner.area.x[0]) pp.x = owner.area.x[1];
				if(pp.z > owner.area.z[1]) pp.z = owner.area.z[0];
				else if(pp.z < owner.area.z[0]) pp.z = owner.area.z[1];
			}
		};
		this.update.owner = this;
	}
};
$$.Device = {
	getOSInfo: function() {
		var ua = navigator.userAgent,
			isWindowsPhone = /(?:Windows Phone)/.test(ua),
			isSymbian = /(?:SymbianOS)/.test(ua) || isWindowsPhone,
			isAndroid = /(?:Android)/.test(ua),
			isFireFox = /(?:Firefox)/.test(ua),
			isChrome = /(?:Chrome|CriOS)/.test(ua),
			isTablet = /(?:iPad|PlayBook)/.test(ua) || (isAndroid && !/(?:Mobile)/.test(ua)) || (isFireFox && /(?:Tablet)/.test(ua)),
			isPhone = /(?:iPhone)/.test(ua) && !isTablet,
			isPc = !isPhone && !isAndroid && !isSymbian && !isTablet;
		return {
			isTablet: isTablet,
			isIPhone: isPhone,
			isAndroid: isAndroid,
			isPc: isPc
		};
	},
	openWebcam: function(video) {
		navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
		window.URL = window.URL || window.webkitURL;
		if(navigator.getUserMedia) {
			navigator.getUserMedia({
				video: true
			}, gotStream, noStream);
		}
		var stream;
		function gotStream(s) {
			$$.global.webCamSteam=s;
			stream = s;
			if(window.URL) {
				video.src = window.URL.createObjectURL(stream);
			} else {
				video.src = stream;
			}
			camvideo.onerror = function(e) {
				stream.stop();
			};
			stream.onended = noStream;
		}

		function noStream(e) {
			var msg = 'No camera available.';
			if(e.code == 1) {
				msg = 'User denied access to use camera.';
			}
			console.log(msg)
		}
	},
	closeWebcam:function(){
		if($$.global.webCamSteam){
			var tracks=$$.global.webCamSteam.getVideoTracks();
			for(var i =0;i<tracks.length;i++){
				tracks[i].stop();
			}
			tracks=$$.global.webCamSteam.getAudioTracks();
			for(var i =0;i<tracks.length;i++){
				tracks[i].stop();
			}
			$$.global.webCamSteam=null;
		}
	},
	toggleWebCam:function(video){
		if($$.global.webCamSteam){
			$$.Device.closeWebcam();
		}else{
			$$.Device.openWebcam(video);
		}
	}
};
$$.sound={
	
}
