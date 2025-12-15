<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "web" middleware group. Make something great!
|
*/

Route::get('/', function () {
    return redirect('/elevators');
});

Route::get('/elevators', function () {
    $config = [
        'elevatorCount' => config('elevator.count'),
        'floors' => config('elevator.floors'),
        'speedPerFloor' => config('elevator.speed_per_floor'),
        'doorWaitTime' => config('elevator.door_wait_time'),
    ];

    return view('elevators', compact('config'));
})->name('elevators');
