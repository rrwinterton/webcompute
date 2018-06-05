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

//Unrolled works for any size
//For testing:
/*    for (int row = 0; row < IMAGE_HEIGHT; row++) {
        for (int col = 0; col < IMAGE_WIDTH; col++) {
            mag = magnitudeValue(X, row, col, IMAGE_HEIGHT, IMAGE_WIDTH);
            Y[row][col] = mag;
            //Y[row][col] = X[row][col];
        }
    }*/

#include <iostream>
#include <iomanip>
#include <string>
#include <cstdlib>
#include <math.h>
#include <cstdio>
#include <chrono>

#ifdef __EMSCRIPTEN__
#include <emscripten/emscripten.h>
#endif
 
using namespace std;
//using namespace std::chrono;

//inline 

#ifdef __cplusplus
extern "C" 
{
#endif

#ifdef __EMSCRIPTEN__
EMSCRIPTEN_KEEPALIVE 
#endif
float magnitudeValue(unsigned char** imageData, int row, int col, int imageHeight, int imageWidth) {
    int Hx[3][3]={{-1, 0, 1}, {-2, 0, 2}, {-1, 0, 1}};
    int Hy[3][3]={{-1, -2, -1}, {0, 0, 0}, {1, 2, 1}};

    float accumulation1_1 = 0;
    float accumulation1_2 = 0;
    float accumulation1_3 = 0;

    int weightsum1 = 1;
    int weightsum2 = 1;

    //accumulation1:
    if ((row != 0) && (col != 0) && (row != imageHeight - 1) && (col != imageWidth - 1)) { // Center of data
        accumulation1_1 = Hx[0][0] * imageData[row - 1][col - 1] + Hx[0][1] * imageData[row - 1][col] + 
            Hx[0][2] * imageData[row - 1][col + 1];

        accumulation1_2 = Hx[1][0] * imageData[row][col - 1] + Hx[1][1] * imageData[row][col] + 
            Hx[1][2] * imageData[row][col + 1];

        accumulation1_3 = Hx[2][0] * imageData[row + 1][col - 1] + Hx[2][1] * imageData[row + 1][col] + 
            Hx[2][2] * imageData[row + 1][col + 1];
    }
    else if ((row == 0) && (col == 0)) { // Top left corner
        accumulation1_2 = Hx[1][1] * imageData[row][col] + Hx[1][2] * imageData[row][col + 1];

        accumulation1_3 = Hx[2][1] * imageData[row + 1][col] + Hx[2][2] * imageData[row + 1][col + 1];
    }
    else if ((row == 0) && (col == imageWidth - 1)) { // Top right corner
        accumulation1_2 = Hx[1][0] * imageData[row][col - 1] + Hx[1][1] * imageData[row][col];

        accumulation1_3 = Hx[2][0] * imageData[row + 1][col - 1] + Hx[2][1] * imageData[row + 1][col];
    }
    else if ((row == imageHeight - 1) && (col == 0)) { // Bottom left corner
        accumulation1_1 = Hx[0][1] * imageData[row - 1][col] + Hx[0][2] * imageData[row - 1][col + 1];

        accumulation1_2 = Hx[1][1] * imageData[row][col] + Hx[1][2] * imageData[row][col + 1];
    }
    else if ((row == imageHeight - 1) && (col == imageWidth - 1)) { // Bottom right corner
        accumulation1_1 = Hx[0][0] * imageData[row - 1][col - 1] + Hx[0][1] * imageData[row - 1][col];

        accumulation1_2 = Hx[1][0] * imageData[row][col - 1] + Hx[1][1] * imageData[row][col];
    }
    else if (col == 0) { // Left Edge
        accumulation1_1 = Hx[0][1] * imageData[row - 1][col] + Hx[0][2] * imageData[row - 1][col + 1];

        accumulation1_2 = Hx[1][1] * imageData[row][col] + Hx[1][2] * imageData[row][col + 1];

        accumulation1_3 = Hx[2][1] * imageData[row + 1][col] + Hx[2][2] * imageData[row + 1][col + 1];
    }
    else if (col == imageWidth - 1) { // Right Edge
        accumulation1_1 = Hx[0][0] * imageData[row - 1][col - 1] + Hx[0][1] * imageData[row - 1][col];

        accumulation1_2 = Hx[1][0] * imageData[row][col - 1] + Hx[1][1] * imageData[row][col];

        accumulation1_3 = Hx[2][0] * imageData[row + 1][col - 1] + Hx[2][1] * imageData[row + 1][col];
    }
    else if (row == 0) { // Top Edge
        accumulation1_2 = Hx[1][0] * imageData[row][col - 1] + Hx[1][1] * imageData[row][col] + 
            Hx[1][2] * imageData[row][col + 1];

        accumulation1_3 = Hx[2][0] * imageData[row + 1][col - 1] + Hx[2][1] * imageData[row + 1][col] + 
            Hx[2][2] * imageData[row + 1][col + 1];
    }
    else if (row == imageHeight - 1) { // Bottom Edge
        accumulation1_1 = Hx[0][0] * imageData[row - 1][col - 1] + Hx[0][1] * imageData[row - 1][col] + 
            Hx[0][2] * imageData[row - 1][col + 1];

        accumulation1_2 = Hx[1][0] * imageData[row][col - 1] + Hx[1][1] * imageData[row][col] + 
            Hx[1][2] * imageData[row][col + 1];
    }
    float accumulation1 = accumulation1_1 + accumulation1_2 + accumulation1_3;
    accumulation1 = accumulation1 / weightsum1;

    //accumulation2:
    float accumulation2_1 = 0;
    float accumulation2_2 = 0;
    float accumulation2_3 = 0;

    if ((row != 0) && (col != 0) && (row != imageHeight - 1) && (col != imageWidth - 1)) { // Center of data
        accumulation2_1 = Hy[0][0] * imageData[row - 1][col - 1] + Hy[0][1] * imageData[row - 1][col] + 
            Hy[0][2] * imageData[row - 1][col + 1];

        accumulation2_2 = Hy[1][0] * imageData[row][col - 1] + Hy[1][1] * imageData[row][col] + 
            Hy[1][2] * imageData[row][col + 1];

        accumulation2_3 = Hy[2][0] * imageData[row + 1][col - 1] + Hy[2][1] * imageData[row + 1][col] + 
            Hy[2][2] * imageData[row + 1][col + 1];
    }
    else if ((row == 0) && (col == 0)) { // Top left corner
        accumulation2_2 = Hy[1][1] * imageData[row][col] + Hy[1][2] * imageData[row][col + 1];

        accumulation2_3 = Hy[2][1] * imageData[row + 1][col] + Hy[2][2] * imageData[row + 1][col + 1];
    }
    else if ((row == 0) && (col == imageWidth - 1)) { // Top right corner
        accumulation2_2 = Hy[1][0] * imageData[row][col - 1] + Hy[1][1] * imageData[row][col];

        accumulation2_3 = Hy[2][0] * imageData[row + 1][col - 1] + Hy[2][1] * imageData[row + 1][col];
    }
    else if ((row == imageHeight - 1) && (col == 0)) { // Bottom left corner
        accumulation2_1 = Hy[0][1] * imageData[row - 1][col] + Hy[0][2] * imageData[row - 1][col + 1];

        accumulation2_2 = Hy[1][1] * imageData[row][col] + Hy[1][2] * imageData[row][col + 1];
    }
    else if ((row == imageHeight - 1) && (col == imageWidth - 1)) { // Bottom right corner
        accumulation2_1 = Hy[0][0] * imageData[row - 1][col - 1] + Hy[0][1] * imageData[row - 1][col];

        accumulation2_2 = Hy[1][0] * imageData[row][col - 1] + Hy[1][1] * imageData[row][col];
    }
    else if (col == 0) { // Left Edge
        accumulation2_1 = Hy[0][1] * imageData[row - 1][col] + Hy[0][2] * imageData[row - 1][col + 1];

        accumulation2_2 = Hy[1][1] * imageData[row][col] + Hy[1][2] * imageData[row][col + 1];

        accumulation2_3 = Hy[2][1] * imageData[row + 1][col] + Hy[2][2] * imageData[row + 1][col + 1];
    }
    else if (col == imageWidth - 1) { // Right Edge
        accumulation2_1 = Hy[0][0] * imageData[row - 1][col - 1] + Hy[0][1] * imageData[row - 1][col];

        accumulation2_2 = Hy[1][0] * imageData[row][col - 1] + Hy[1][1] * imageData[row][col];

        accumulation2_3 = Hy[2][0] * imageData[row + 1][col - 1] + Hy[2][1] * imageData[row + 1][col];
    }
    else if (row == 0) { // Top Edge
        accumulation2_2 = Hy[1][0] * imageData[row][col - 1] + Hy[1][1] * imageData[row][col] + 
            Hy[1][2] * imageData[row][col + 1];

        accumulation2_3 = Hy[2][0] * imageData[row + 1][col - 1] + Hy[2][1] * imageData[row + 1][col] + 
            Hy[2][2] * imageData[row + 1][col + 1];

    }
    else if (row == imageHeight - 1) { // Bottom Edge
        accumulation2_1 = Hy[0][0] * imageData[row - 1][col - 1] + Hy[0][1] * imageData[row - 1][col] + 
            Hx[0][2] * imageData[row - 1][col + 1];

        accumulation2_2 = Hy[1][0] * imageData[row][col - 1] + Hy[1][1] * imageData[row][col] + 
            Hy[1][2] * imageData[row][col + 1];
    }

    float accumulation2 = accumulation2_1 + accumulation2_2 + accumulation2_3;
    accumulation2 = accumulation2 / weightsum2;

    float magnitude = accumulation1 * accumulation1 + accumulation2 * accumulation2;    
    return magnitude;

    /*float magnitude = sqrt(accumulation1 * accumulation1 + accumulation2 * accumulation2);    
    magnitude = (magnitude > 255) ? 255 : magnitude;
    return magnitude;*/
}

#ifdef __EMSCRIPTEN__S
EMSCRIPTEN_KEEPALIVE
#endif 
unsigned char** sobelFilter(unsigned char** imageData, int imageHeight, int imageWidth) {
    float mag = 0;
    unsigned char** outputData = new unsigned char*[imageHeight];
    for (int row = 0; row < imageHeight; row++) {
        outputData[row] = new unsigned char[imageWidth];
        for (int col = 0; col < imageWidth; col++) {
            mag = magnitudeValue(imageData, row, col, imageHeight, imageWidth);
            mag = sqrt(mag);
            mag = (mag > 255) ? 255 : mag;
            outputData[row][col] = mag;
        }
    }
    return outputData;
}
#ifdef __cplusplus
}
#endif
    
int main() {
    int Ret = 0;
    const int IMAGE_WIDTH = 4160;
    const int IMAGE_HEIGHT = 3120;

    FILE *fp = NULL;
    fp = fopen("SobelFilterImage_4160x3120.yuv", "rb");
    FILE *fout = fopen("SobelFilterImage_4160x3120_out_iccsimd.yuv", "wb");

    const int ROWS_TWO = IMAGE_HEIGHT;
    const int COLUMNS_TWO = IMAGE_WIDTH;

    // two dimentional input image matrix
    unsigned char **X = new unsigned char*[ROWS_TWO];
    if (X == NULL) {
        cout << "X failed" << endl;
        Ret = -1;
        return Ret;
    }

    // 2D ouput image
    unsigned char **Y = new unsigned char*[ROWS_TWO];
    if (Y == NULL) {
        cout << "Y failed" << endl;
        Ret = -1;
        return Ret;
    }
 
    // read image
    if (fp == NULL) {
        cout << "failed to open input file" << endl;
        Ret = -2;
        return Ret;
    }

    for (int i = 0; i < ROWS_TWO; ++i) {
        X[i] = new unsigned char [COLUMNS_TWO];
        Y[i] = new unsigned char [COLUMNS_TWO];
    }

    for (int i = 0; i < IMAGE_HEIGHT; ++i) {
        for(int j = 0; j < IMAGE_WIDTH; ++j) {
            size_t value = fread(&X[i][j], 1, 1, fp);
            if (value == 0)
               break;
        }
    }

    fflush(fp);
    fclose(fp);
 
    cout << X[0][0] << " " << X[0][1] << endl;
    printf("%i %i \n", X[0][0],  X[0][1] );

    // Sobel Filter
    std::chrono::high_resolution_clock::time_point t0 = std::chrono::high_resolution_clock::now();
    Y = sobelFilter(X, IMAGE_HEIGHT, IMAGE_WIDTH);
    std::chrono::high_resolution_clock::time_point t1 = std::chrono::high_resolution_clock::now();

    std::chrono::duration<long double> time_span = std::chrono::duration_cast<std::chrono::microseconds>(t1-t0);
    cout << time_span.count() * 1000 << " milliseconds elapsed" << endl;
    // write Y to file
    for (int i = 0; i < IMAGE_HEIGHT; ++i) {;
        for(int j = 0; j < IMAGE_WIDTH; ++j) {
            fwrite(&Y[i][j], 1, 1, fout);
        }
    }

    cout << Y[0][0] << " " << Y[0][1] << endl;
        fflush(fout);
        fclose(fout);
 
    printf("%i %i \n", Y[0][0], Y[0][1] );

    for (int i = 0; i < ROWS_TWO; ++i) {
        delete [] X[i];
        delete [] Y[i];
    }
    delete [] X;
    delete [] Y;

    return Ret;
}