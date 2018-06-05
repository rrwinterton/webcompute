/*==============================================================================
Copyright(c) 2018 Intel Corporation
Permission is hereby granted, free of charge, to any person obtaining a
copy of this software and associated documentation files(the "Software"),
to deal in the Software without restriction, including without limitation
the rights to use, copy, modify, merge, publish, distribute, sublicense,
and / or sell copies of the Software, and to permit persons to whom the
Software is furnished to do so, subject to the following conditions:
The above copyright notice and this permission notice shall be included
in all copies or substantial portions of the Software.
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL
THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR
OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE,
ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
OTHER DEALINGS IN THE SOFTWARE.
============================================================================*/

function run() {
    const originalCanvas = document.getElementById('originalCanvas');
    const originalContext = originalCanvas.getContext('2d');

    const sobelCanvas = document.getElementById('sobelCanvas');
    const sobelContext = sobelCanvas.getContext('2d');

    const jsInput = document.getElementById('file1');
    const wasmInput = document.getElementById('file2');

    let runType = ["none"];
    let elapsedTime;

    jsInput.onchange = function (event) {
        const url = window.URL.createObjectURL(event.target.files[0]);
        runType[0] = 'js';
        loadImage(url);
        this.value = null;
        return false;
    };

    wasmInput.onchange = function (event) {
        const url = window.URL.createObjectURL(event.target.files[0]);
        runType[0] = 'wasm';
        loadImage(url);
        this.value = null;
        return false;
    };

    const loadImage = (url) => {
        const image = new Image();
        image.src = url;
        image.onload = displayImages;
    };

    var imageData;
    var grayscaleData = new Array();
    var sobelImageData = new Array();


    const displayImages = (event) => {
        const myImage = event.target;
        const width = myImage.width;
        const height = myImage.height;

        originalCanvas.width = width;
        originalCanvas.height = height;

        sobelCanvas.width = originalCanvas.width;
        sobelCanvas.height = originalCanvas.height;

        originalContext.drawImage(myImage, 0, 0);
        imageData = originalContext.getImageData(0, 0, width, height);;

        toGrayscale(width, height);

        // Sobel Filter
        var t0 = performance.now();

        if (runType[0] === 'js') {
            sobelFilter(width, height);
        } else if (runType[0] === 'wasm') {
            sobelImageData = filter(grayscaleData, height, width);
        } else {
            throw "need to specify if you want to run in Webassembly or Javascript";
        }
        var t1 = performance.now();
        elapsedTime = t1 - t0;

        console.log(elapsedTime + ' milliseconds');
        var timer = document.getElementById(runType[0] + 'Timer');
        var displayTime = Math.round(elapsedTime * 1000000)/1000000;
        timer.innerHTML = "Time: " + displayTime + "ms";

        toImageData(width, height);

        sobelContext.putImageData(imageData, 0, 0);
    };

    const toImageData = (width, height) => {
        let temp = new Array();
        for (let i = 0; i < height; i++) {
            for (let j = 0; j < width; j++) {
                temp.push(sobelImageData[i][j]);
            }
        }
        var tempUint8Clamped = Uint8ClampedArray.from(temp);
        let index = 0;
        for (let i = 0; i < imageData.height * imageData.width * 4; i += 4) {
            imageData.data[i] = tempUint8Clamped[index];
            imageData.data[i + 1] = tempUint8Clamped[index];
            imageData.data[i + 2] = tempUint8Clamped[index];
            imageData.data[i + 3] = 255;
            ++index;
        }
        /*for (let i = 0; i < height; ++i) {
            for (let j = 0; j < width; ++j) {
                document.write(tempUint8Clamped[i * width + j] + " ");
            }
            document.write('\n');
        }*/
    };

    const toGrayscale = (width, height) => {
        for (let i = 0; i < height; ++i) {
            grayscaleData[i] = new Array();
            let colIndex = 0;
            for (let j = 0; j < width * 4; j += 4) {
                let red = imageData.data[i * width * 4 + j];
                let green = imageData.data[i * width * 4 + j + 1];
                let blue = imageData.data[i * width * 4 + j + 2];

                let gray = (red * 0.3 + green * 0.59 + blue * 0.11);
                if (gray > 255) {
                    gray = 255;
                }
                grayscaleData[i][colIndex] = gray;
                colIndex++;
            }
        }
    };

    const sobelFilter = (width, height) => {
        //let Hx = new Array ([-1, 0, 1], [-2, 0, 2], [-1, 0, 1]);
        //let Hy = new Array ([-1, -2, -1], [0, 0, 0], [1, 2, 1]);

        for (let row = 0; row < height; row++) {
            sobelImageData[row] = new Array(width);
            for (let col = 0; col < width; col++) {
                /*let accumulation1 = 0;
                let weightsum1 = 1;
                let accumulation2 = 0;
                let weightsum2 = 1;
                for (let i = -1; i <= 1; i++) {
                    for (let j = -1; j <= 1; j++) {
                        let pel = 0;
                        if ((row + i >= 0) && (col + j >= 0) && (row + i < height) && (col + j < width)) {
                            pel = grayscaleData[row + i][col + j];
                        }
                        accumulation1 += pel * Hx[1 + i][1 + j];
                        accumulation2 += pel * Hy[1 + i][1 + j];
                    }
                }
                accumulation2 = accumulation2 / weightsum2;
                mag = Math.sqrt(accumulation1 * accumulation1 + accumulation2 * accumulation2);
                mag = (mag > 255) ? 255 : mag;
                sobelImageData[row][col] = mag;*/

                //Uncomment the next line if you want it unrolled, and comment out from 'let accumulation1 = 0' to here and Hy and Hx
                let mag = magnitudeValue(grayscaleData, row, col, height, width);
                mag = Math.sqrt(mag);
                mag = (mag > 255) ? 255 : mag;
                sobelImageData[row][col] = mag;
            }
        }
    };

    const magnitudeValue = (imageData, row, col, imageHeight, imageWidth) => {
        let Hx = new Array([-1, 0, 1], [-2, 0, 2], [-1, 0, 1]);
        let Hy = new Array([-1, -2, -1], [0, 0, 0], [1, 2, 1]);

        const weightsum1 = 1;
        const weightsum2 = 1;

        let accumulation1_1 = 0;
        let accumulation1_2 = 0;
        let accumulation1_3 = 0;

        //accumulation1:
        if ((row !== 0) && (col !== 0) && (row !== imageHeight - 1) && (col !== imageWidth - 1)) { // Center of data
            accumulation1_1 = Hx[0][0] * imageData[row - 1][col - 1] + Hx[0][1] * imageData[row - 1][col] +
                Hx[0][2] * imageData[row - 1][col + 1];

            accumulation1_2 = Hx[1][0] * imageData[row][col - 1] + Hx[1][1] * imageData[row][col] +
                Hx[1][2] * imageData[row][col + 1];

            accumulation1_3 = Hx[2][0] * imageData[row + 1][col - 1] + Hx[2][1] * imageData[row + 1][col] +
                Hx[2][2] * imageData[row + 1][col + 1];
        }
        else if ((row === 0) && (col === 0)) { // Top left corner
            accumulation1_2 = Hx[1][1] * imageData[row][col] + Hx[1][2] * imageData[row][col + 1];

            accumulation1_3 = Hx[2][1] * imageData[row + 1][col] + Hx[2][2] * imageData[row + 1][col + 1];
        }
        else if ((row === 0) && (col === imageWidth - 1)) { // Top right corner
            accumulation1_2 = Hx[1][0] * imageData[row][col - 1] + Hx[1][1] * imageData[row][col];

            accumulation1_3 = Hx[2][0] * imageData[row + 1][col - 1] + Hx[2][1] * imageData[row + 1][col];
        }
        else if ((row === imageHeight - 1) && (col === 0)) { // Bottom left corner
            accumulation1_1 = Hx[0][1] * imageData[row - 1][col] + Hx[0][2] * imageData[row - 1][col + 1];

            accumulation1_2 = Hx[1][1] * imageData[row][col] + Hx[1][2] * imageData[row][col + 1];
        }
        else if ((row === imageHeight - 1) && (col === imageWidth - 1)) { // Bottom right corner
            accumulation1_1 = Hx[0][0] * imageData[row - 1][col - 1] + Hx[0][1] * imageData[row - 1][col];

            accumulation1_2 = Hx[1][0] * imageData[row][col - 1] + Hx[1][1] * imageData[row][col];
        }
        else if (col === 0) { // Left Edge
            accumulation1_1 = Hx[0][1] * imageData[row - 1][col] + Hx[0][2] * imageData[row - 1][col + 1];

            accumulation1_2 = Hx[1][1] * imageData[row][col] + Hx[1][2] * imageData[row][col + 1];

            accumulation1_3 = Hx[2][1] * imageData[row + 1][col] + Hx[2][2] * imageData[row + 1][col + 1];
        }
        else if (col === imageWidth - 1) { // Right Edge
            accumulation1_1 = Hx[0][0] * imageData[row - 1][col - 1] + Hx[0][1] * imageData[row - 1][col];

            accumulation1_2 = Hx[1][0] * imageData[row][col - 1] + Hx[1][1] * imageData[row][col];

            accumulation1_3 = Hx[2][0] * imageData[row + 1][col - 1] + Hx[2][1] * imageData[row + 1][col];
        }
        else if (row === 0) { // Top Edge
            accumulation1_2 = Hx[1][0] * imageData[row][col - 1] + Hx[1][1] * imageData[row][col] +
                Hx[1][2] * imageData[row][col + 1];

            accumulation1_3 = Hx[2][0] * imageData[row + 1][col - 1] + Hx[2][1] * imageData[row + 1][col] +
                Hx[2][2] * imageData[row + 1][col + 1];
        }
        else if (row === imageHeight - 1) { // Bottom Edge
            accumulation1_1 = Hx[0][0] * imageData[row - 1][col - 1] + Hx[0][1] * imageData[row - 1][col] +
                Hx[0][2] * imageData[row - 1][col + 1];

            accumulation1_2 = Hx[1][0] * imageData[row][col - 1] + Hx[1][1] * imageData[row][col] +
                Hx[1][2] * imageData[row][col + 1];
        }
        let accumulation1 = accumulation1_1 + accumulation1_2 + accumulation1_3;
        accumulation1 = accumulation1 / weightsum1;

        //accumulation2:
        let accumulation2_1 = 0;
        let accumulation2_2 = 0;
        let accumulation2_3 = 0;

        if ((row !== 0) && (col !== 0) && (row !== imageHeight - 1) && (col !== imageWidth - 1)) { // Center of data
            accumulation2_1 = Hy[0][0] * imageData[row - 1][col - 1] + Hy[0][1] * imageData[row - 1][col] +
                Hy[0][2] * imageData[row - 1][col + 1];

            accumulation2_2 = Hy[1][0] * imageData[row][col - 1] + Hy[1][1] * imageData[row][col] +
                Hy[1][2] * imageData[row][col + 1];

            accumulation2_3 = Hy[2][0] * imageData[row + 1][col - 1] + Hy[2][1] * imageData[row + 1][col] +
                Hy[2][2] * imageData[row + 1][col + 1];
        }
        else if ((row === 0) && (col === 0)) { // Top left corner
            accumulation2_2 = Hy[1][1] * imageData[row][col] + Hy[1][2] * imageData[row][col + 1];

            accumulation2_3 = Hy[2][1] * imageData[row + 1][col] + Hy[2][2] * imageData[row + 1][col + 1];
        }
        else if ((row === 0) && (col === imageWidth - 1)) { // Top right corner
            accumulation2_2 = Hy[1][0] * imageData[row][col - 1] + Hy[1][1] * imageData[row][col];

            accumulation2_3 = Hy[2][0] * imageData[row + 1][col - 1] + Hy[2][1] * imageData[row + 1][col];
        }
        else if ((row === imageHeight - 1) && (col === 0)) { // Bottom left corner
            accumulation2_1 = Hy[0][1] * imageData[row - 1][col] + Hy[0][2] * imageData[row - 1][col + 1];

            accumulation2_2 = Hy[1][1] * imageData[row][col] + Hy[1][2] * imageData[row][col + 1];
        }
        else if ((row === imageHeight - 1) && (col === imageWidth - 1)) { // Bottom right corner
            accumulation2_1 = Hy[0][0] * imageData[row - 1][col - 1] + Hy[0][1] * imageData[row - 1][col];

            accumulation2_2 = Hy[1][0] * imageData[row][col - 1] + Hy[1][1] * imageData[row][col];
        }
        else if (col === 0) { // Left Edge
            accumulation2_1 = Hy[0][1] * imageData[row - 1][col] + Hy[0][2] * imageData[row - 1][col + 1];

            accumulation2_2 = Hy[1][1] * imageData[row][col] + Hy[1][2] * imageData[row][col + 1];

            accumulation2_3 = Hy[2][1] * imageData[row + 1][col] + Hy[2][2] * imageData[row + 1][col + 1];
        }
        else if (col === imageWidth - 1) { // Right Edge
            accumulation2_1 = Hy[0][0] * imageData[row - 1][col - 1] + Hy[0][1] * imageData[row - 1][col];

            accumulation2_2 = Hy[1][0] * imageData[row][col - 1] + Hy[1][1] * imageData[row][col];

            accumulation2_3 = Hy[2][0] * imageData[row + 1][col - 1] + Hy[2][1] * imageData[row + 1][col];
        }
        else if (row === 0) { // Top Edge
            accumulation2_2 = Hy[1][0] * imageData[row][col - 1] + Hy[1][1] * imageData[row][col] +
                Hy[1][2] * imageData[row][col + 1];

            accumulation2_3 = Hy[2][0] * imageData[row + 1][col - 1] + Hy[2][1] * imageData[row + 1][col] +
                Hy[2][2] * imageData[row + 1][col + 1];
        }
        else if (row === imageHeight - 1) { // Bottom Edge
            accumulation2_1 = Hy[0][0] * imageData[row - 1][col - 1] + Hy[0][1] * imageData[row - 1][col] +
                Hx[0][2] * imageData[row - 1][col + 1];

            accumulation2_2 = Hy[1][0] * imageData[row][col - 1] + Hy[1][1] * imageData[row][col] +
                Hy[1][2] * imageData[row][col + 1];
        }

        let accumulation2 = accumulation2_1 + accumulation2_2 + accumulation2_3;
        accumulation2 = accumulation2 / weightsum2;

        let magnitude = accumulation1 * accumulation1 + accumulation2 * accumulation2;

        return magnitude;
    };

    function filter(input, height, width) {
        const iBufs = [];
        //const oBufs = [];
        let iTypedBufs;
        //let oTypedBufs;
        let ibufbuf;
        //let obufbuf;
        let result;
        let returnData;


        for (let i = 0; i < height; i++) {
            iBufs.push(Module._malloc(width));
            //oBufs.push(Module._malloc(width));
            Module.HEAPU8.set(input[i], iBufs[i]);
            //Module.HEAPU8.set(output[i], oBufs[i]);
        }

        iTypedBufs = new Uint32Array(iBufs);
        //oTypedBufs = new Uint32Array(oBufs);

        ibufbuf = Module._malloc(height * 4);
        //obufbuf = Module._malloc(height * 4);

        Module.HEAPU32.set(iTypedBufs, ibufbuf >> 2);
        // Module.HEAPU32.set(oTypedBufs, obufbuf >> 2);


        result = Module._sobelFilter(ibufbuf, height, width);
        //console.log(buf1, buf2);

        Module._free(ibufbuf);
        //Module._free(obufbuf);

        for (i = 0; i < height; i++) {
            Module._free(iBufs[i]);
            //Module._free(oBufs[i]);
        }

        //console.log(result);
        let temp;
        returnData = [];

        function bufToU8Arr(buf, length) {
            let tempArr = [];
            for (let j = 0; j < length; j++) {
                tempArr.push(Module.HEAPU8[buf + j]);
            }
            return new Uint8Array(tempArr)
        }

        for (let i = 0; i < height; i++) {
            temp = Module.HEAPU32[result / 4 + i];
            returnData.push(bufToU8Arr(temp, width));
        }


        return returnData;

        //console.log(buffer);
        //console.log(Module.asm.stackSave);
        //console.log(sum(arr1, length));
        //console.log(Module._sum([3],length));
        //console.log(_sum([3],2));
    }
}
