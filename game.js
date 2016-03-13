window.onload = function() {
	(function(){
		var context = null;
		var Game = {
			canvas : document.getElementById('canvas'),
			setup : function(){
				if(this.canvas.getContext){
					context = this.canvas.getContext('2d');
					this.width = this.canvas.width;
					this.height = this.canvas.height;
					
					Screen.welcome();
					this.canvas.addEventListener('click', Game.runGame, false);

					Ctrl.init();
				}
			},
			runGame : function(){
				Game.canvas.removeEventListener('click', Game.runGame, false);
				Game.init();
				Game.animate();
				//animate函数只跑一次，因为如果gameover再跑 animate函数等于使用了多
				//次raf动画
			},
			animate: function(){
				window.requestAnimationFrame(Game.animate);
				Game.draw();
			},
			init : function(){
				BackGround.init();
				Hud.init();
				Bricks.init();
				Ball.init();
				paddle.init();
			},
			draw : function(){
				context.clearRect(0, 0, this.width, this.height);

				BackGround.draw();
				Hud.draw();
				Bricks.draw();
				Ball.draw();
				paddle.draw();
			}
		};
		var Hud = {
			init : function(){
				this.lv = 1;
				this.score = 0;
			},
			draw : function(){
				context.font = '12px helvetica, arial';
				context.fillStyle = 'white';
				context.textAlign = 'left';
				context.fillText('Score: ' + this.score, 5, Game.height - 5);
				context.textAlign = 'right';
				context.fillText('Lv: ' + this.lv, Game.width - 5, Game.height - 5);
			},
			levelUp : function(){
				this.lv++;

				Ball.init();
				Bricks.init();
				paddle.init();
			},
			limitLevel : function(){
				return this.lv > 5 ? 5 : this.lv;
			}
		}
		//控制
		var Ctrl = {
			left : null,
			right : null,
			init : function(){
				window.addEventListener('keydown', this.keyDown, false);
				window.addEventListener('keyup', this.keyUp, false);
				window.addEventListener('mousemove', this.paddleMouse, false);
			},
			keyDown : function(Event){
				var myEvent = Event || window.event;
				//console.log(myEvent.keyCode);
				switch(myEvent.keyCode){
					case 39:
						Ctrl.right = true;
						break;
					case 37:
						Ctrl.left = true;
						break;
					default:
						break;
				}
			},
			keyUp : function(Event){
				var myEvent = Event || window.event;
				switch(myEvent.keyCode){
					case 39:
						Ctrl.right = false;
						break;
					case 37:
						Ctrl.left = false;
						break;
					default:
						break;
				}
			},
			paddleMouse : function(Event){
				var myEvent = Event || window.event;
				var mouseX = myEvent.pageX;
				var canvasX = Game.canvas.offsetLeft;
				var paddleMid = paddle.w / 2;

				if(mouseX > canvasX && mouseX < canvasX + Game.width){
					var newX = mouseX - canvasX;
					newX -= paddleMid;
					paddle.x = newX;
				}
			}
		};
		//背景
		var BackGround = {
			init : function(){
				this.ready = false;
				this.background_img = new Image();
				this.background_img.src = 'background.jpg';
				this.background_img.onload = function(){
					BackGround.ready = true;
				};
			},
			draw : function(){
				if (this.ready) {
					context.drawImage(this.background_img, 0, 0);
				}
			}
		};
		//砖块
		var Bricks = {
			gap : 2,//间距
			width : 80,
			height : 15,

			init : function(){
				this.col = 5;//列
				//砖块的行数随着关卡数上升但有限制
				this.row = 2 + Hud.limitLevel(Hud.lv);
				this.total = 0;//当前关卡已经消失的砖块数目

				this.birckArr = new Array(this.row);
				for(var i = 0;i < this.birckArr.length; i++){
					this.birckArr[i] = new Array(this.col);
				}
				for(var i = 0;i < this.row; i++){
					for(var j = 0;j < this.col; j++){
						this.birckArr[i][j] = true;
					}
				}
			},
			draw : function(){
				for(var i = this.row; i--;){
					for(var j = this.col; j--;){
						if (this.birckArr[i][j] !== false) {
							if(Ball.x >= this.x(j) && Ball.x <= (this.x(j) + this.width) && (Ball.y + Ball.r) >= this.y(i) && (Ball.y - Ball.r) <= this.y(i)){
								Hud.score++;
								this.total++;

								this.birckArr[i][j] = false;
								Ball.speed_y = -Ball.speed_y;
								continue;
							}

							context.fillStyle = this.getFillColor(i);
							context.fillRect(this.x(j), this.y(i), this.width, this.height);
						}
					}
				}
				if (this.total === (this.row * this.col)) {
					Hud.levelUp();
				}
			},
			getFillColor : function(row){
				switch(row){
					case 0:
						return this.gradientPurple ? this.gradientPurple :
						this.gradientPurple = this.makeFillColor(row,'#bd06f9','#9604c7');
					case 1:
						return this.gradientRed ? this.gradientRed :
						this.gradientRed = this.makeFillColor(row,'#F9064A','#c7043b');
					case 2:
						return this.gradientGreen ? this.gradientGreen :
						this.gradientGreen = this.makeFillColor(row,'#05fa15','#04c711');
					default:
						return this.gradientOrange ? this.gradientOrange:
						this.gradientOrange = this.makeFillColor(row,'#faa105','#077f04');
				}
			},
			makeFillColor : function(row,startColor,endColor){
				var y = this.y(row);
				//创建线性渐变
				var grad = context.createLinearGradient(0, y, 0, y+this.height);
				//设置渐变颜色的起始和终点
				grad.addColorStop(0, startColor);
				grad.addColorStop(1, endColor);
				return grad;
			},
			x : function(col){
				return (col * this.width + col * this.gap);
			},
			y : function(row){
				return (row * this.height + row * this.gap);
			}
		}
		//小球
		var Ball = {
			r : 10,
			init : function(){
				this.x = 120;
				this.y = 120;
				//小球速度随之关卡数上升
				this.speed_x = 1.5 + (Hud.lv * 0.5);
				this.speed_y = -1.5 - (Hud.lv * 0.5);
			},
			draw : function(){
				this.edges();
				this.collide();
				this.move();
				//绘制小球
				context.beginPath();
				context.arc(this.x, this.y, this.r, 0, 2*Math.PI);
				context.fillStyle = '#eee';
				context.fill();
			},
			//控制小球边界
			edges : function(){
				if(this.y <= 0){
					this.y = 1;
					this.speed_y = -this.speed_y;
				}
				else if(this.y > Game.height){
					//玩家失败后对 小球，砖块，球拍隐藏。
					//下次 Game.init初始化又会复位
					this.speed_x = this.speed_y = 0;
					this.x = this.y = 1000;
					paddle.x = paddle.y = 1000;
					Bricks.col = Bricks.row = 0;

					Screen.gameOver();
					Game.canvas.addEventListener('click', Screen.restartGame, false);
					return;
				}
				if(this.x <= 0){
					this.x = 1;
					this.speed_x = -this.speed_x;
				}
				else if(this.x >= Game.width){
					this.x = Game.width;
					this.speed_x = -this.speed_x;
				}
			},
			//小球与球拍的碰撞
			collide : function(){
				if(this.x >= paddle.x && this.x <= (paddle.x + paddle.w) && (this.y + this.r) >= paddle.y && this.y <= (paddle.y + paddle.h))
				{
					this.speed_y = -this.speed_y;
					this.speed_x = 7 * ((this.x - (paddle.x + paddle.w/2)) / paddle.w);
				}
			},
			//小球的移动
			move : function(){
				this.x += this.speed_x;
				this.y += this.speed_y;
			}
		};
		//球拍
		var paddle = {
			w : 90,
			h : 20,
			r : 9,
			init : function(){
				this.x = 100;
				this.y = 210;
				this.speed = 4;
			},
			draw : function(){
				this.move();
				//绘制球拍
				context.beginPath();
				context.moveTo(this.x + this.r, this.y);
				context.lineTo(this.x + this.w - this.r, this.y);
				context.arcTo(this.x + this.w, this.y, this.x + this.w, this.y + this.r, this.r);
				context.lineTo(this.x + this.w, this.y + this.h - this.r);
				context.arcTo(this.x + this.w, this.y + this.h, this.x + this.w - this.r, this.y + this.h, this.r);
				context.lineTo(this.x + this.r, this.y + this.h);
				context.arcTo(this.x , this.y + this.h, this.x, this.y + this.h - this.r, this.r);
				context.lineTo(this.x, this.y + this.r);
				context.arcTo(this.x, this.y, this.x + this.r, this.y, this.r);
				context.closePath();
				//填色
				context.fillStyle = this.getFillColor();
				context.fill();
			},
			move : function(){
				if(this.x >= (-1/2 * this.w) && Ctrl.left){
					this.x -= this.speed;
				}
				if(this.x <= (Game.width - this.w/2) && Ctrl.right){
					this.x += this.speed;
				}
			},
			getFillColor : function(){
				if(this.gradientCache){
					return this.gradientCache;
				}
				this.gradientCache = context.createLinearGradient(this.x ,this.y, this.x, this.y + 20);
				this.gradientCache.addColorStop(0, '#eee');
				this.gradientCache.addColorStop(1, '#999');

				return this.gradientCache;
			}
		}

		var Screen = {
			welcome : function(){
				this.text = 'Canvas For 弹球游戏';
				this.subText = 'Click To Start';
				this.color = 'white';

				this.create();
			},
			create : function(){
				context.fillStyle = 'black';
				context.fillRect(0, 0, Game.width, Game.height);
				
				context.fillStyle = this.color;
				context.textAlign = 'center';
				context.font = '40px helvetica arial';
				context.fillText(this.text, Game.width/2, Game.height/2);
				
				context.fillStyle = '#666';//给次文本规定颜色
				context.font = '20px helvetica arial';
				context.fillText(this.subText, Game.width/2, Game.height/2 + 30);
			},
			gameOver : function(){
				this.text = 'Game Over';
				this.subText = 'Click To Retry';
				this.color = 'red';

				this.create();
			},
			restartGame : function(){
				Game.canvas.removeEventListener('click', Screen.restartGame, false);
				Game.init();
			}
		}
		Game.setup();
	})();
}