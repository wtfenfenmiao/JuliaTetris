// 屏幕宽高
var screenWidth, screenHeight;
// 移动设备下，状态栏高度
var mobileStatusCanvasHeight = 0;
//方块单元大小
var defaultSize = 40;
//行列数
var rowNum, colNum=12;
// 初始化函数
window.onload = function() {
    var canvas1 = document.getElementById("canvas1"),
        canvas2 = document.getElementById("canvas2"),
        canvas3 = document.getElementById("canvas3");
    ctx1 = canvas1.getContext("2d");
    ctx2 = canvas2.getContext("2d");
    ctx3 = canvas3.getContext("2d");

    screenWidth = window.innerWidth;
    screenHeight = window.innerHeight;

    //根据尺寸响应式设计宽高
    if (screenWidth > screenHeight) {
        canHeight = Number.parseInt(screenHeight / defaultSize) * defaultSize;
        canWidth = canHeight;
        var canWrap = document.getElementById("wrap");
        canWrap.style.marginLeft = (screenWidth - canWidth) / 2 + "px";
        var controlPanel = document.getElementById("control-panel");
        controlPanel.style.left = canWidth + "px";
        canvas3.height = canHeight;

        defaultSize = Number.parseInt(canWidth / colNum);
        rowNum = Number.parseInt(canHeight / defaultSize);
    } else {
        var controlPanel = document.getElementById("control-panel");
        controlPanel.style.display = "none"
        var mobileContrl = document.getElementById("mobile-control");
        mobileContrl.style.display = "block";
        var mobileContrlHeight = mobileContrl.offsetHeight;

        var mobileStatusCanvas = document.getElementById("mobile-status-canvas"),
            mobileStatus = document.getElementById("mobile-status");
        mobileStatusCanvasHeight = 150;
        mobileStatus.style.display = "block";
        mobileStatusCanvas.height = mobileStatusCanvasHeight;
        mobileStatusCanvas.width = screenWidth;
        ctx3 = mobileStatusCanvas.getContext("2d");
        
        //根据列数来计算大小
        defaultSize = Number.parseInt(screenWidth / colNum);
        canHeight = Number.parseInt((screenHeight - mobileContrlHeight - mobileStatusCanvasHeight) / defaultSize) * defaultSize;
        canWidth = Number.parseInt(screenWidth / defaultSize) * defaultSize;
        rowNum = Number.parseInt(canHeight / defaultSize);

        canvas1.style.top = mobileStatusCanvasHeight + "px";
    }

    canvas1.width = canWidth;
    canvas1.height = canHeight;
    canvas2.width = canWidth;
    canvas2.height = canHeight;

    var playBtn = document.getElementById("playBtn");
    playBtn.style.cursor = "pointer";
    playBtn.onclick = function(event) {
        var elem = event.currentTarget;
        console.log(elem);
        isPlay = !isPlay;
        if (!isPlay) elem.className = "pause";
        else elem.className = "";
    };

    game();
};

//ctx2是下面一层canvas绘画上下文,ctx3用于显示分数控件等
var ctx1, ctx2, ctx3;
//绘制环境的宽高
var canWidth, canHeight;
//绘制方块的样式
var blockStrokeStyle = "white",
    blockFillStyle = "red";
//代表需要绘制的方块,以及下一个需要绘制的方块
var block, next;
//环境状态数组,0:代表不存在,1:代表存在
var envirStatus;
//用于计数下落的速度
var initFallCount = 45,
    fallCount = initFallCount,
    accel = 1;
//用于判断游戏是否结束
var isEnd = false;
//用于判断游戏是否是运行
var isPlay = true;
//用于判断是不是戒指轮次
var EndTrigger = false;

function game() {
    gameInit();
    gameLoop();
}
// 游戏初始化
function gameInit() {
    //暂停位清除
    isPlay = true;
    //结束位位清除
    isEnd = false;
    //
    EndTrigger = false;
    //初始化下落速度
    fallCount = initFallCount;
    //数据初始化
    dataObj.init();
    //初始化环境状态
    envirStatus = new Array(colNum);
    var i = 0,
        j = 0;
    for (i = 0; i < colNum; i++) {
        envirStatus[i] = new Array(rowNum);
        for (j = 0; j < rowNum; j++) {
            envirStatus[i][j] = 0;
        }
    }
    //方块左移
    var blockMoveLeft = function() {
        if (canMove(0)) {
            block.x -= defaultSize;
            block.calMatrix();
        }
    };
    //方块右移
    var blockMoveRight = function() {
        if (canMove(1)) {
            block.x += defaultSize;
            block.calMatrix();
        }
    };
    //绑定键盘事件,left:左,right:右,up:改变状态,down:向下加速
    window.onkeydown = function(event) {
        var key = event.keyCode;
        if (key === 37) {
            blockMoveLeft();
        } else if (key === 39) {
            blockMoveRight();
        } else if (key === 38) {
            blockChange();
        } else if (key === 40) {
            accel = 8;
        }
    };
    //放开加速键停止加速
    window.onkeyup = function(event) {
        var key = event.keyCode;
        if (key === 40) {
            accel = 1;
        }
    };
    //设置按钮点击事件
    var downBtn = document.getElementById("down-btn"),
        leftBtn = document.getElementById("left-btn"),
        rightBtn = document.getElementById("right-btn"),
        rotateBtn = document.getElementById("rotate-btn");
    downBtn.ontouchstart = function(e) {
        e.preventDefault();
        accel = 5;
    };
    leftBtn.ontouchstart = function(e) {
        e.preventDefault();
        blockMoveLeft();
        var flag = setInterval(blockMoveLeft,100);
        leftBtn.ontouchend = function(){
            clearInterval(flag);
        }
    };
    rightBtn.ontouchstart = function(e) {
        e.preventDefault();
        blockMoveRight();
        var flag = setInterval(blockMoveRight,100);
        rightBtn.ontouchend = function(){
            clearInterval(flag);
        }
    };
    rotateBtn.ontouchstart = function(e) {
        e.preventDefault();
        blockChange();
        var flag = setInterval(blockChange,100);
        rotateBtn.ontouchend = function(){
            clearInterval(flag);
        }
    };
    downBtn.ontouchend = function(e) {
        e.preventDefault();
        accel = 1;
    };

    drawBlockEnvir(ctx2);

    //最初方块生成
    block = BlockFactory.newInstance(rand(7) + 1, defaultSize);
    next = rand(7) + 1;
}
var animateFlag; //动画帧查询返回变量
// 游戏循环
function gameLoop() {
    cancelAnimationFrame(animateFlag);
    if (isEnd) return;
    animateFlag = requestAnimationFrame(gameLoop, 15);
    if (!isPlay) return;
    ctx1.clearRect(0, 0, canWidth, canHeight);
    block.draw(ctx1);
    //判断是否可以下落
    if (fallCount <= accel && !canFall()) {
        ctx1.clearRect(0, 0, canWidth, canHeight);
        var matrix = block.matrix;
        for (var i = 0, len = matrix.length; i < len; i++) {
            var y = +matrix[i].y,
                x = +matrix[i].x;
            envirStatus[x][y] = 1;
        }
        blockFillStyle = "rgb(" + rand(150) + "," + rand(150) + "," + rand(150) + ")";
        eraser();

        drawBlockEnvir(ctx2);
        //判断游戏是否结束
        if (isOver()) gameOver();
        if (EndTrigger)
            {
                // Juliaprocess
                isEnd = true;
                JuliaProcess();
            }
        if (next == 8)
            {
                EndTrigger = true;
            }
            
        block = BlockFactory.newInstance(next, defaultSize);
        //如果分数到了2000，就开始落戒指，点击，出信件。
        if (dataObj.cont >= 20)
            next = 8;
        else        
            next = rand(7) + 1;
    }
    fallCount -= accel;
    if (fallCount <= 0) {
        fallCount = initFallCount;
        block.y += defaultSize;
    }
    showScore();
}


//判断能否下落
function canFall() {
    var matrix = block.matrix;
    var i = 0,
        len;
    //用于判断是否能够下落
    var flag = true;
    var y, x;
    for (i = 0, len = matrix.length; i < len; i++) {
        y = matrix[i].y;
        x = matrix[i].x;
        if (y >= rowNum - 1) {
            flag = false;
            break;
        } else if (envirStatus[x][y + 1]) {
            flag = false;
            break;
        }
    }
    return flag;
}
//是否能左移或右移,左:0,右:1
function canMove(dir) {
    var matrix = block.matrix,
        len = matrix.length,
        i = 0;
    var flag = true;
    for (i = 0; i < len; i++) {
        var x = matrix[i].x,
            y = matrix[i].y;
        if (!dir) {
            if (x - 1 < 0 || envirStatus[x - 1][y]) {
                flag = false;
                break;
            }

        } else {
            if (x > colNum - 2 || envirStatus[x + 1][y]) {
                flag = false;
                break;
            }
        }
    }
    return flag;
}
//变换函数
function blockChange() {
    var flag = true;
    block.status = (++block.status) % 4;
    var tempMatrix = block.matrix;
    block.calMatrix();
    var j, i, len;
    //判断前后移动一格是否可以改变状态
    for (j = 0; j < 3; j++) {
        flag = true;
        if (j === 1) {
            block.x += defaultSize;
            block.calMatrix();
        } else if (j === 2) {
            block.x -= 2 * defaultSize;
            block.calMatrix();
        }
        //获取变换后的matrix
        var matrix = block.matrix;
        for (i = 0, len = matrix.length; i < len; i++) {
            var x = matrix[i].x,
                y = matrix[i].y;
            if (x > colNum - 1 || (x < 0) || (y > rowNum - 1) || envirStatus[x][y]) {
                flag = false;
                break;
            }
        }
        if (flag) break;
    }
    //若果不能旋转还原状态
    if (!flag) {
        //还原水平位置
        block.x += defaultSize;
        block.status = (block.status === 0) ? 3 : (block.status - 1);
        block.matrix = tempMatrix;
    }
}

//擦除填满的行
function eraser() {
    var i, j, len, len2;
    //判断是否可删除,返回可删除行号
    var flag = true;
    var num = -1;
    for (i = 0, len = rowNum; i < len; i++) {
        for (j = 0, len2 = colNum; j < len2; j++) {
            if (!envirStatus[j][i]) {
                flag = false;
                break;
            }
        }
        if (flag) {
            num = i;
            break;
        } else {
            flag = true;
        }
    }
    if (num !== -1) {
        for (; num > 0; num--) {
            for (i = 0; i < colNum; i++) {
                envirStatus[i][num] = envirStatus[i][num - 1];
            }
        }
        for (i = 0; i < colNum; i++) {
            envirStatus[i][0] = 0;
        }
        dataObj.cont++;
        eraser();
    }
}

//根据方块大小,绘制网格
function drawBlockEnvir(ctx) {
    var i = 0,
        len;
    ctx.clearRect(0, 0, canWidth, canHeight);
    //绘制网格的行
    ctx.beginPath();
    ctx.strokeStyle = "black";
    for (i = 1, len = rowNum; i < len; i++) {
        ctx.moveTo(0, defaultSize * i);
        ctx.lineTo(canWidth, defaultSize * i);
    }
    //绘制网格的列
    for (i = 1, len = colNum; i < len; i++) {
        ctx.moveTo(defaultSize * i, 0);
        ctx.lineTo(defaultSize * i, canHeight);
    }

    //如果当前是戒指的话，就画一个戒指（如果如果可以的话，就在这个ctx2上的戒指上加一个点击，能打开信的）
    
    if (next == 8)
    {
//        var img = new Image();   // 创建一个<img>元素
//        img.src = 'img/ring.png'; // 设置图片源地址
//        x = (Math.floor(colNum / 2) - 1) * defaultSize;
//        y = -2 * defaultSize;
//        ctx.drawImage(img,  x-defaultSize, y-defaultSize, 2*defaultSize, 2*defaultSize);
    }
    
    else
    {
         //在对应的位置画一个方块
        var j = 0,
        len2;
        for (i = 0, len = envirStatus.length; i < len; i++) {
            for (j = 0, len2 = envirStatus[i].length; j < len2; j++) {
                if (envirStatus[i][j]) {
                    ctx.fillStyle = "#0867A5";
                    ctx.fillRect(i * defaultSize, j * defaultSize, defaultSize, defaultSize);
                }
            }
        }   
    }
    
    ctx.stroke();
    ctx.closePath();
}
//用于记录分值等信息
var dataObj = {
    cont: 0,
    init: function() {
        this.cont = 0;
    }
};

//显示分数
function showScore() {
    if (screenWidth > screenHeight) {
        pcShowScore();
    } else {
        mobileShowScore();
    }
}
// 移动端显示分数
function mobileShowScore() {
    ctx3.clearRect(0, 0, canWidth, canHeight);
    ctx3.beginPath();
    ctx3.fillStyle = "rgb(13,30,64)";
    ctx3.fillRect(0, 0, canWidth, canHeight);
    ctx3.closePath();

    var canvas3 = document.getElementById("canvas3"),
        cWidth = canvas3.offsetWidth,
        cHeight = canvas3.offsetHeight;
    ctx3.fillStyle = "white";
    ctx3.font = "50px Arial";
    ctx3.fillText("Score: ", cWidth / 20, 100);
    ctx3.fillText(dataObj.cont * 100, cWidth / 2 + 150, 100);
    ctx3.fillText("Next", cWidth / 2 + 500, 100);
    var showBlock = BlockFactory.newInstance(next, 40);
    showBlock.x = cWidth / 2 + 700;
    showBlock.y = cHeight / 2 + defaultSize;
    showBlock.draw(ctx3, 40);
}
//PC端显示分数
function pcShowScore() {
    ctx3.clearRect(0, 0, 200, canHeight);
    ctx3.beginPath();
    ctx3.fillStyle = "rgb(13,30,64)";
    ctx3.fillRect(0, 0, 200, canHeight);
    ctx3.closePath();

    var canvas3 = document.getElementById("canvas3"),
        cWidth = canvas3.offsetWidth,
        cHeight = canvas3.offsetHeight;
    ctx3.fillStyle = "white";
    ctx3.font = "50px Arial";
    ctx3.fillText("Score", cWidth / 2 - 3 * 20, 100);
    //显示得分
    if (dataObj.cont)
        ctx3.fillText(dataObj.cont * 100, cWidth / 2 - 2 * 20, 100 + cHeight / 6);
    else
        ctx3.fillText(dataObj.cont * 100, cWidth / 2, 100 + cHeight / 6);
    ctx3.fillText("Next", cWidth / 2 - 2 * 20, 300);
    var showBlock = BlockFactory.newInstance(next, 40);
    showBlock.x = cWidth / 2;
    showBlock.y = cHeight / 2 + 2 * defaultSize;
    showBlock.draw(ctx3, 40);
}
//判断游戏是否结束
function isOver() {
    var i = 0,
        matrix = block.matrix,
        len = matrix.length;
    for (i = 0; i < len; i++) {
        if (matrix[i].y < 0) {
            isEnd = true;
        }
    }
    return isEnd;
}


//游戏结束后的一些处理
function gameOver() {
    ctx1.font = "50px Arial";
    ctx1.fillStyle = "black";
    ctx1.fillText("Game Over", canWidth / 2 - 20 * 5, canHeight / 2 - 25);
    ctx1.fillText("Click To Restart", canWidth / 2 - 20 * 8, canHeight / 2 + 25);

    var canvas1 = document.getElementById("canvas1");
    canvas1.style.cursor = "pointer";
    canvas1.onclick = function(event) {
        var elem = event.currentTarget;
        elem.onclick = false;
        elem.style.cursor = "default";
        game();
    };
}

function JuliaProcess() {
    ctx1.font = "40px Arial";
    ctx1.fillStyle = "black";
    ctx1.fillText("情人节快乐～", canWidth / 2 - 20 * 8 + 10, canHeight / 2 - 120);
    var img = new Image();   // 创建一个<img>元素
    img.src = 'img/ring.png'; // 设置图片源地址
    x = canWidth / 2 - 100;
    y = canHeight / 2 - 100;
    ctx1.drawImage(img,x,y, defaultSize*2, defaultSize*2);
    
    ctx1.font = "20px Arial";
    ctx1.fillStyle = "black";
    ctx1.fillText("（凭截图去换韬韬的信～）", canWidth / 2 - 150, canHeight / 2 + 100);
    ctx1.fillText("（点击可以再玩一轮～）", canWidth / 2 - 150, canHeight / 2 + 130);

    var canvas1 = document.getElementById("canvas1");
    canvas1.style.cursor = "pointer";
    canvas1.onclick = function(event) {
        var elem = event.currentTarget;
        elem.onclick = false;
        elem.style.cursor = "default";
        game();
    };
}

